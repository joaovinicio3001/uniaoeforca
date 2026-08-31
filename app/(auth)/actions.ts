"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv, hasServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/security/audit";
import { recordSignupAcceptances } from "@/lib/legal/service";
import {
  checkLoginLock,
  registerLoginFailure,
  clearLoginFailures,
} from "@/lib/security/lockout";
import { recordIpSignal } from "@/lib/risk/signals";
import { recordLoginDevice } from "@/lib/security/devices";
import { hashCPF, cpfLast3 } from "@/lib/security/crypto";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "@/lib/validation/auth";
import type { Provider } from "@supabase/supabase-js";
import type { FormState } from "@/app/(auth)/form-state";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

function zodToFieldErrors(error: {
  issues: { path: (string | number)[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

// ------------------------------------------------------------------
// Cadastro (doc §6.1)
// ------------------------------------------------------------------
export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Ecoado de volta ao formulário em qualquer erro, para não apagar o que a
  // pessoa digitou. Senhas nunca voltam.
  const values: Record<string, string> = {
    fullName: String(formData.get("fullName") ?? ""),
    cpf: String(formData.get("cpf") ?? ""),
    email: String(formData.get("email") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
  };

  const ip = await clientIp();
  const rl = rateLimit(`register:${ip}`, RATE_LIMITS.register);
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
      values,
    };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms") === "on",
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: zodToFieldErrors(parsed.error),
      values,
    };
  }

  const data = parsed.data;
  const DUP_MSG =
    "Você já tem uma conta com esses dados. Faça login ou use “Esqueci minha senha”.";

  // Bloqueia CPF já cadastrado antes de criar o usuário no Auth.
  if (hasServiceRole()) {
    try {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("cpf_hash", hashCPF(data.cpf))
        .maybeSingle();
      if (existing) {
        return { status: "error", message: DUP_MSG, duplicate: true, values };
      }
    } catch {
      // Sem service role em runtime — segue e confia na constraint UNIQUE.
    }
  }

  const supabase = await createClient();

  const { data: signUp, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: {
        full_name: data.fullName,
        display_name: data.fullName.split(/\s+/)[0],
        cpf_hash: hashCPF(data.cpf),
        cpf_last3: cpfLast3(data.cpf),
        phone: data.whatsapp,
        marketing_opt_in: data.marketingOptIn,
        terms_accepted: true,
      },
    },
  });

  if (error) {
    const lower = error.message.toLowerCase();
    const isDup = lower.includes("already") || error.code === "user_already_exists";
    if (isDup) {
      return { status: "error", message: DUP_MSG, duplicate: true, values };
    }
    const emailFailed =
      lower.includes("email") ||
      lower.includes("smtp") ||
      lower.includes("mail") ||
      error.code === "unexpected_failure" ||
      error.code === "email_provider_disabled";
    return {
      status: "error",
      message: emailFailed
        ? "Não conseguimos enviar o e-mail de confirmação agora. Tente novamente em alguns minutos."
        : "Não foi possível concluir o cadastro. Tente novamente.",
      values,
    };
  }

  await writeAuditLog({
    actorUserId: signUp.user?.id ?? null,
    action: "auth.register",
    entityType: "user",
    entityId: signUp.user?.id ?? null,
    after: { email: data.email, marketing_opt_in: data.marketingOptIn },
  });

  if (signUp.user?.id) {
    const ua = (await headers()).get("user-agent");
    await recordSignupAcceptances(signUp.user.id, ip, ua);
  }

  // Confirmação de e-mail ativa → sem sessão ainda. Vai para a tela de
  // digitação do código de 6 dígitos.
  if (!signUp.session) {
    redirect(`/cadastro/confirmar?email=${encodeURIComponent(data.email)}`);
  }

  redirect("/painel");
}

// ------------------------------------------------------------------
// Confirmação de e-mail por código de 6 dígitos (OTP)
// ------------------------------------------------------------------
export async function verifyEmailOtpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const rl = rateLimit(`verify-otp:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const parsed = verifyOtpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Código inválido.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "signup",
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: "Código incorreto ou expirado. Peça um novo e tente de novo.",
    };
  }

  await writeAuditLog({
    actorUserId: data.user.id,
    action: "auth.email_confirmed",
    entityType: "user",
    entityId: data.user.id,
  });
  await recordIpSignal(data.user.id);
  await recordLoginDevice(data.user.id, data.session?.access_token);

  redirect("/painel");
}

export async function resendEmailOtpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const rl = rateLimit(`resend-otp:${ip}`, RATE_LIMITS.forgotPassword);
  if (!rl.ok) {
    return {
      status: "error",
      message: `Aguarde ${rl.retryAfterSeconds}s para pedir outro código.`,
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) {
    return { status: "error", message: "E-mail inválido." };
  }

  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email });

  return { status: "success", message: "Enviamos um novo código para o seu e-mail." };
}

// ------------------------------------------------------------------
// Login social (Google / X)
// ------------------------------------------------------------------
export async function oauthAction(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "") as Provider;
  if (provider !== "google" && provider !== "twitter") {
    redirect("/login?erro=provedor-invalido");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error || !data.url) {
    redirect("/login?erro=oauth");
  }

  redirect(data.url);
}

// ------------------------------------------------------------------
// Login (doc §6.2)
// ------------------------------------------------------------------
export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const rl = rateLimit(`login:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe e-mail e senha válidos.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const redirectTo =
    (formData.get("redirect") as string | null)?.startsWith("/") &&
    !(formData.get("redirect") as string).startsWith("//")
      ? (formData.get("redirect") as string)
      : "/painel";

  const lock = await checkLoginLock(parsed.data.email);
  if (lock.locked) {
    return {
      status: "error",
      message: `Muitas tentativas incorretas. Tente novamente em ${Math.ceil(
        lock.retryAfterSeconds / 60,
      )} min ou redefina a senha.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    await registerLoginFailure(parsed.data.email);
    return { status: "error", message: "E-mail ou senha incorretos." };
  }

  await clearLoginFailures(parsed.data.email);

  await writeAuditLog({
    actorUserId: data.user.id,
    action: "auth.login",
    entityType: "user",
    entityId: data.user.id,
  });
  await recordIpSignal(data.user.id);
  await recordLoginDevice(data.user.id, data.session?.access_token);

  // 2FA: se a conta tem fator TOTP verificado, a sessão fica em aal1 até o
  // desafio ser respondido.
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel === "aal1") {
    redirect(`/login/2fa?redirect=${encodeURIComponent(redirectTo)}`);
  }

  redirect(redirectTo);
}

// ------------------------------------------------------------------
// Desafio 2FA (TOTP) no login
// ------------------------------------------------------------------
export async function verifyLogin2faAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const rl = rateLimit(`login-2fa:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  const rawRedirect = String(formData.get("redirect") ?? "/painel");
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/painel";

  if (code.length !== 6) {
    return { status: "error", message: "Digite o código de 6 dígitos." };
  }

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = (factors?.totp ?? [])[0];
  if (!factor) {
    redirect(redirectTo);
  }

  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
    factorId: factor!.id,
  });
  if (cErr || !challenge) {
    return { status: "error", message: "Não foi possível validar agora. Tente de novo." };
  }
  const { data: verified, error: vErr } = await supabase.auth.mfa.verify({
    factorId: factor!.id,
    challengeId: challenge.id,
    code,
  });
  if (vErr || !verified) {
    return { status: "error", message: "Código incorreto. Tente novamente." };
  }

  await writeAuditLog({
    actorUserId: verified.user?.id ?? null,
    action: "auth.2fa_passed",
    entityType: "user",
    entityId: verified.user?.id ?? null,
  });

  redirect(redirectTo);
}

// ------------------------------------------------------------------
// Recuperação de senha (doc §6.2)
// ------------------------------------------------------------------
export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const rl = rateLimit(`forgot:${ip}`, RATE_LIMITS.forgotPassword);
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/painel/seguranca`,
  });

  // Vai para a tela de código sempre — não revela se o e-mail existe.
  redirect(
    `/recuperar-senha/redefinir?email=${encodeURIComponent(parsed.data.email)}`,
  );
}

// Redefine a senha com o código de 6 dígitos recebido por e-mail.
export async function resetWithCodeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const rl = rateLimit(`reset-code:${ip}`, RATE_LIMITS.login);
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const otp = verifyOtpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });
  const pw = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!otp.success || !pw.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: {
        ...(otp.success ? {} : zodToFieldErrors(otp.error)),
        ...(pw.success ? {} : zodToFieldErrors(pw.error)),
      },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: otp.data.email,
    token: otp.data.token,
    type: "recovery",
  });
  if (error || !data.user) {
    return {
      status: "error",
      message: "Código incorreto ou expirado. Peça um novo e tente de novo.",
    };
  }

  const { error: upErr } = await supabase.auth.updateUser({
    password: pw.data.password,
  });
  if (upErr) {
    return { status: "error", message: "Não foi possível atualizar a senha." };
  }

  await writeAuditLog({
    actorUserId: data.user.id,
    action: "auth.password_reset",
    entityType: "user",
    entityId: data.user.id,
  });
  await recordIpSignal(data.user.id);
  await recordLoginDevice(data.user.id, data.session?.access_token);

  redirect("/painel");
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise a nova senha.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: "error",
      message: "Link de recuperação inválido ou expirado. Solicite um novo.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { status: "error", message: "Não foi possível atualizar a senha." };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.password_reset",
    entityType: "user",
    entityId: user.id,
  });

  return { status: "success", message: "Senha atualizada. Você já pode entrar." };
}

// ------------------------------------------------------------------
// Logout
// ------------------------------------------------------------------
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (user) {
    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.logout",
      entityType: "user",
      entityId: user.id,
    });
  }
  redirect("/");
}
