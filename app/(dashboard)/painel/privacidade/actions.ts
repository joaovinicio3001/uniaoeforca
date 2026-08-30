"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";

export async function requestAccountDeletionAction(): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser("/painel/privacidade");
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("data_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "deletion")
    .in("status", ["pending", "processing"])
    .maybeSingle();
  if (existing) {
    return { ok: true, message: "Você já tem uma solicitação de exclusão em andamento." };
  }

  await admin.from("data_requests").insert({ user_id: user.id, kind: "deletion" });
  await writeAuditLog({
    actorUserId: user.id,
    action: "lgpd.deletion_requested",
    entityType: "user",
    entityId: user.id,
  });
  revalidatePath("/painel/privacidade");
  return {
    ok: true,
    message:
      "Solicitação registrada. Concluiremos a exclusão/anonimização em até 15 dias, respeitando prazos legais de retenção de dados financeiros.",
  };
}
