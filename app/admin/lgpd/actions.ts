"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export async function anonymizeUserAction(formData: FormData) {
  const user = await requireStaff();
  if (!can(user.roles, "users:manage")) {
    redirect("/admin/lgpd?erro=sem-permissao");
  }
  const userId = String(formData.get("userId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) redirect("/admin/lgpd?erro=id-invalido");

  const admin = createAdminClient();
  const { data } = await admin.rpc("anonymize_user", {
    p_user_id: userId,
    p_actor: user.id,
  });
  revalidatePath("/admin/lgpd");
  redirect(`/admin/lgpd?ok=${encodeURIComponent(String(data ?? "erro"))}`);
}
