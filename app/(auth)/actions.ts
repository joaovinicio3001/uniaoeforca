"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { writeAuditLog } from "@/lib/security/audit";
import { recordIpSignal } from "@/lib/risk/signals";
import { hashCPF, cpfLast3 } from "@/lib/security/crypto";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
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
  const ip = await clientIp();
  const rl = rateLimit(`register:${ip}`, RATE_LIMITS.register);
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    birthDate: formData.get("birthDate"),
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
    };
  }

  const data = parsed.data;
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
        birth_date: data.birthDate.toISOString().slice(0, 10),
        phone: data.whatsapp,
        marketing_opt_in: data.marketingOptIn,
        terms_accepted: true,
      },
    },
  });

  if (error) {
    // Mensagens genéricas para não vazar existência de conta.
    const msg =
      error.message.toLowerCase().includes("already") ||
      error.code === "user_already_exists"
        ? "Não foi possível concluir o cadastro com esses dados."
        : "Não foi possível concluir o cadastro. Tente novamente.";
    return { status: "error", message: msg };
  }

  await writeAuditLog({
    actorUserId: signUp.user?.id ?? null,
    action: "auth.register",
    entityType: "user",
    entityId: signUp.user?.id ?? null,
    after: { email: data.email, marketing_opt_in: data.marketingOptIn },
  });

  // Se a confirmação de e-mail estiver ativa, não há sessão ainda.
  if (!signUp.session) {
    return {
      status: "check-email",
      message:
        "Cadastro recebido. Enviamos um link de confirmação para o seu e-mail.",
    };
  }

  redirect("/painel");
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { status: "error", message: "E-mail ou senha incorretos." };
  }

  await writeAuditLog({
    actorUserId: data.user.id,
    action: "auth.login",
    entityType: "user",
    entityId: data.user.id,
  });
  await recordIpSignal(data.user.id);

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

  // Resposta sempre idêntica — não revela se o e-mail existe.
  return {
    status: "success",
    message:
      "Se houver uma conta com esse e-mail, enviamos as instruções de recuperação.",
  };
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
