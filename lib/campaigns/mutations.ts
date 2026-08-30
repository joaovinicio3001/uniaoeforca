import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import type { Database } from "@/lib/database.types";
import {
  canTransition,
  type Actor,
  type CampaignStatus,
} from "@/lib/campaigns/state-machine";

type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"];

/**
 * Transição de estado da campanha. Executada com service_role porque a policy
 * de RLS do dono só permite editar em draft/rejected — toda mudança de status
 * passa por aqui, valida a máquina de estados, grava evento de moderação,
 * auditoria e (opcionalmente) notifica o dono.
 */
export async function transitionCampaign(opts: {
  campaignId: string;
  to: CampaignStatus;
  actor: Actor;
  actorUserId: string;
  reason?: string;
  notifyOwner?: boolean;
  extraPatch?: CampaignUpdate;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: campaign, error: readErr } = await admin
    .from("campaigns")
    .select("id, owner_user_id, status, title, published_at")
    .eq("id", opts.campaignId)
    .maybeSingle();

  if (readErr || !campaign) return { ok: false, error: "Campanha não encontrada." };

  const from = campaign.status as CampaignStatus;
  if (from === opts.to) return { ok: true };

  if (!canTransition(from, opts.to, opts.actor)) {
    return {
      ok: false,
      error: `Transição não permitida: ${from} → ${opts.to} (${opts.actor}).`,
    };
  }

  const patch: CampaignUpdate = {
    status: opts.to,
    ...opts.extraPatch,
  };
  if (opts.to === "active" && !campaign.published_at) {
    patch.published_at = new Date().toISOString();
  }
  if (opts.to === "completed" || opts.to === "archived") {
    patch.ended_at = new Date().toISOString();
  }
  if (opts.to === "rejected" || opts.to === "blocked") {
    patch.moderation_reason = opts.reason ?? null;
  }

  const { error: updErr } = await admin
    .from("campaigns")
    .update(patch)
    .eq("id", opts.campaignId);
  if (updErr) return { ok: false, error: updErr.message };

  await admin.from("campaign_moderation_events").insert({
    campaign_id: opts.campaignId,
    actor_user_id: opts.actorUserId,
    from_status: from,
    to_status: opts.to,
    reason: opts.reason ?? null,
  });

  await writeAuditLog({
    actorUserId: opts.actorUserId,
    action: `campaign.transition.${opts.to}`,
    entityType: "campaign",
    entityId: opts.campaignId,
    before: { status: from },
    after: { status: opts.to, reason: opts.reason ?? null },
  });

  if (opts.notifyOwner) {
    await admin.from("notifications").insert({
      user_id: campaign.owner_user_id,
      type: `campaign_${opts.to}`,
      payload: {
        campaign_id: opts.campaignId,
        title: campaign.title,
        reason: opts.reason ?? null,
      },
    });
  }

  return { ok: true };
}

/** Muda a capa da campanha (owner/staff) — usa service_role. */
export async function setCampaignCover(opts: {
  campaignId: string;
  mediaId: string | null;
  actorUserId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("campaigns")
    .update({ cover_media_id: opts.mediaId })
    .eq("id", opts.campaignId);
  if (error) return { ok: false, error: error.message };
  await writeAuditLog({
    actorUserId: opts.actorUserId,
    action: "campaign.set_cover",
    entityType: "campaign",
    entityId: opts.campaignId,
    after: { cover_media_id: opts.mediaId },
  });
  return { ok: true };
}
