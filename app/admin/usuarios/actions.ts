"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import { notifyUser } from "@/lib/notifications/service";

const BAN_FOREVER = "876000h"; // ~100 anos

async function guard() {
  const user = await requireStaff();
  if (!can(user.roles, "users:manage")) {
    redirect("/admin/usuarios?erro=sem-permissao");
  }
  return user;
}

/** Bloqueia ou desbloqueia a conta de um usuário. */
export async function setAccountStatusAction(formData: FormData) {
  const staff = await guard();
  const userId = String(formData.get("userId") ?? "");
  const action = formData.get("action") === "block" ? "block" : "unblock";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId) redirect("/admin/usuarios?erro=usuario-invalido");
  if (action === "block" && reason.length < 5) {
    redirect(`/admin/usuarios/${userId}?erro=motivo-obrigatorio`);
  }

  const admin = createAdminClient();
  const nextStatus = action === "block" ? "blocked" : "active";

  const { error } = await admin
    .from("profiles")
    .update({ status: nextStatus })
    .eq("id", userId);
  if (error) {
    redirect(`/admin/usuarios/${userId}?erro=${encodeURIComponent(error.message)}`);
  }

  // Enforcement no Auth: banido não renova token.
  await admin.auth.admin.updateUserById(userId, {
    ban_duration: action === "block" ? BAN_FOREVER : "none",
  });

  await writeAuditLog({
    actorUserId: staff.id,
    action: action === "block" ? "user.blocked" : "user.unblocked",
    entityType: "user",
    entityId: userId,
    after: { reason: reason || null },
  });

  await notifyUser(
    userId,
    action === "block" ? "account_blocked" : "account_unblocked",
    { reason: reason || null },
  );

  revalidatePath(`/admin/usuarios/${userId}`);
  revalidatePath("/admin/usuarios");
  redirect(
    `/admin/usuarios/${userId}?ok=${action === "block" ? "bloqueado" : "desbloqueado"}`,
  );
}
