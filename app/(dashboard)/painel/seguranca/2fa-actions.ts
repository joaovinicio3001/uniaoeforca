"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/withdrawals/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { writeAuditLog } from "@/lib/security/audit";

export type TwoFactorState = {
  status: "idle" | "error" | "ok";
  message?: string;
};

/** Inicia a inscrição de um fator TOTP e devolve o QR + segredo. */
export async function startEnroll2FA(): Promise<
  | { ok: true; factorId: string; qr: string; secret: string }
  | { ok: false; error: string }
> {
  const user = await requireUser("/painel/seguranca");
  const supabase = await createClient();

  const { data: factors } = await supabase.auth.mfa.listFactors();
  if ((factors?.totp ?? []).length > 0) {
    return { ok: false, error: "A verificação em duas etapas já está ativa." };
  }
  // Remove qualquer inscrição incompleta anterior para gerar um QR novo.
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Autenticador",
  });
  if (error || !data) {
    return { ok: false, error: "Não foi possível iniciar a verificação." };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "security.2fa_enroll_started",
    entityType: "user",
    entityId: user.id,
  });

  return {
    ok: true,
    factorId: data.id,
    qr: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/** Confirma o código do app autenticador e ativa o 2FA. */
export async function activate2FAAction(
  _prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
  const user = await requireUser("/painel/seguranca");
  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");

  if (!factorId || code.length !== 6) {
    return { status: "error", message: "Digite o código de 6 dígitos do app." };
  }
  const rl = rateLimit(`2fa-activate:${user.id}`, {
    limit: 6,
    windowSeconds: 300,
  });
  if (!rl.ok) {
    return { status: "error", message: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const supabase = await createClient();
  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (cErr || !challenge) {
    return { status: "error", message: "Não foi possível validar agora. Tente de novo." };
  }
  const { error: vErr } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (vErr) {
    return { status: "error", message: "Código incorreto. Verifique o app e tente de novo." };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "security.2fa_enabled",
    entityType: "user",
    entityId: user.id,
  });
  revalidatePath("/painel/seguranca");
  return { status: "ok", message: "Verificação em duas etapas ativada." };
}

/** Desativa o 2FA (exige a senha da conta). */
export async function disable2FAAction(
  _prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
  const user = await requireUser("/painel/seguranca");
  const password = String(formData.get("password") ?? "");
  if (!user.email || !password) {
    return { status: "error", message: "Informe sua senha." };
  }
  const rl = rateLimit(`2fa-disable:${user.id}`, {
    limit: 5,
    windowSeconds: 900,
  });
  if (!rl.ok) {
    return { status: "error", message: "Muitas tentativas. Aguarde." };
  }
  if (!(await verifyPassword(user.email, password))) {
    return { status: "error", message: "Senha incorreta." };
  }

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp") {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "security.2fa_disabled",
    entityType: "user",
    entityId: user.id,
  });
  revalidatePath("/painel/seguranca");
  return { status: "ok", message: "Verificação em duas etapas desativada." };
}
