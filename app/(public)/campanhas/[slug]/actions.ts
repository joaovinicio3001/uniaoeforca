"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { reportSchema } from "@/lib/campaigns/validation";
import type { CampaignFormState } from "@/lib/campaigns/form-state";

/**
 * Denúncia de campanha (doc §7.3). Exige login (RLS: reporter_user_id = auth.uid()).
 */
export async function reportCampaignAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await getSessionUser();
  const slug = String(formData.get("slug") ?? "");
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/campanhas/${slug}`)}`);
  }

  const rl = rateLimit(`report:${user.id}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.ok) {
    return { status: "error", message: "Muitas denúncias recentes. Tente mais tarde." };
  }

  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Selecione um motivo válido." };
  }

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!campaign) return { status: "error", message: "Campanha não encontrada." };

  const { error } = await supabase.from("reports").insert({
    campaign_id: campaign.id,
    reporter_user_id: user.id,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });
  if (error) {
    return { status: "error", message: "Não foi possível registrar a denúncia." };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "campaign.reported",
    entityType: "campaign",
    entityId: campaign.id,
    after: { reason: parsed.data.reason },
  });

  return {
    status: "success",
    message: "Denúncia registrada. Nossa equipe vai analisar. Obrigado.",
  };
}
