"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser, getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyPassword } from "@/lib/withdrawals/service";
import { currentSessionId } from "@/lib/security/devices";
import { passwordSchema } from "@/lib/validation/auth";
import type { FormState } from "@/app/(auth)/form-state";

function zErrors(e: {
  issues: { path: (string | number)[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const i of e.issues) (out[String(i.path[0] ?? "_")] ??= []).push(i.message);
  return out;
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "A nova senha precisa ser diferente da atual.",
  });

// ------------------------------------------------------------------
// Alterar senha (valida a senha atual no backend)
// ------------------------------------------------------------------
export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/painel/seguranca");
  const session = await getSessionUser();
  if (!session?.email) {
    return { status: "error", message: "Sessão inválida. Entre novamente." };
  }

  const rl = rateLimit(`password-change:${user.id}`, {
    limit: 5,
    windowSeconds: 900,
  });
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: zErrors(parsed.error),
    };
  }

  const ok = await verifyPassword(session.email, parsed.data.currentPassword);
  if (!ok) {
    return {
      status: "error",
      message: "Senha atual incorreta.",
      fieldErrors: { currentPassword: ["Senha atual incorreta."] },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (error) {
    return {
      status: "error",
      message: "Não foi possível atualizar sua senha. Tente novamente.",
    };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.password_changed",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/painel/seguranca");
  return { status: "success", message: "Senha atualizada com sucesso." };
}

// ------------------------------------------------------------------
// Sair de outros dispositivos (mantém a sessão atual)
// ------------------------------------------------------------------
export async function logoutOtherSessionsAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  const user = await requireUser("/painel/seguranca");
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    return { ok: false, message: "Não foi possível concluir a operação." };
  }

  // Limpa os registros de dispositivos das sessões que acabaram de cair.
  try {
    const current = await currentSessionId();
    const admin = createAdminClient();
    let del = admin.from("user_devices").delete().eq("user_id", user.id);
    if (current) del = del.neq("auth_session_id", current);
    await del;
  } catch {
    /* ignore */
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.other_sessions_revoked",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/painel/seguranca");
  return { ok: true, message: "Outras sessões encerradas." };
}

// ------------------------------------------------------------------
// Encerrar uma sessão específica
// ------------------------------------------------------------------
export async function revokeSessionAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser("/painel/seguranca");
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return { ok: false, message: "Sessão inválida." };
  }

  const current = await currentSessionId();
  if (sessionId === current) {
    return {
      ok: false,
      message: "Você não pode encerrar a sessão deste dispositivo por aqui.",
    };
  }

  const admin = createAdminClient();
  const { data: revoked, error } = await admin.rpc("sec_revoke_user_session", {
    p_user_id: user.id,
    p_session_id: sessionId,
  });
  if (error) {
    return { ok: false, message: "Não foi possível concluir a operação." };
  }
  await admin
    .from("user_devices")
    .delete()
    .eq("user_id", user.id)
    .eq("auth_session_id", sessionId);

  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.session_revoked",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/painel/seguranca");
  return revoked
    ? { ok: true, message: "Sessão encerrada." }
    : { ok: true, message: "Essa sessão já não estava ativa." };
}
