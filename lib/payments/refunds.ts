import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/security/audit";

export async function getDonationForAdmin(donationId: string) {
  if (!hasServiceRole()) return null;
  const admin = createAdminClient();

  const { data: donation } = await admin
    .from("donations")
    .select(
      "id, campaign_id, donor_user_id, donor_name, anonymous, message, gross_amount_cents, platform_fee_cents, provider_fee_cents, net_amount_cents, status, created_at, paid_at, campaigns(title, slug, status)",
    )
    .eq("id", donationId)
    .maybeSingle();
  if (!donation) return null;

  const [{ data: payment }, { data: refund }] = await Promise.all([
    admin
      .from("payments")
      .select("provider, provider_reference, status, end_to_end_id, paid_at")
      .eq("donation_id", donationId)
      .maybeSingle(),
    admin
      .from("refunds")
      .select("amount_cents, reason, provider_refunded, created_at")
      .eq("donation_id", donationId)
      .maybeSingle(),
  ]);

  return { donation, payment: payment ?? null, refund: refund ?? null };
}

export async function refundDonation(params: {
  donationId: string;
  actorId: string;
  reason: string;
}): Promise<{ ok: boolean; error?: string; amountCents?: number }> {
  if (!hasServiceRole()) return { ok: false, error: "service_role ausente." };
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("refund_donation", {
    p_donation_id: params.donationId,
    p_actor: params.actorId,
    p_reason: params.reason,
  });
  if (error) {
    return { ok: false, error: "Falha ao processar o estorno." };
  }
  const res = data as { ok: boolean; error?: string; amount_cents?: number };
  if (!res.ok) return { ok: false, error: res.error };

  await writeAuditLog({
    actorUserId: params.actorId,
    action: "donation.refunded",
    entityType: "donation",
    entityId: params.donationId,
    after: { amount_cents: res.amount_cents, reason: params.reason },
  });
  return { ok: true, amountCents: res.amount_cents };
}

/** Marca que a devolução PIX ao doador foi efetuada (controle operacional). */
export async function markRefundSettled(
  donationId: string,
  actorId: string,
): Promise<void> {
  if (!hasServiceRole()) return;
  const admin = createAdminClient();
  await admin
    .from("refunds")
    .update({ provider_refunded: true })
    .eq("donation_id", donationId);
  await writeAuditLog({
    actorUserId: actorId,
    action: "donation.refund_settled",
    entityType: "donation",
    entityId: donationId,
  });
}
