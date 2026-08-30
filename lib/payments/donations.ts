import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv, serverEnv } from "@/lib/env";
import { writeAuditLog } from "@/lib/security/audit";
import { getPixInProvider } from "@/lib/payments";
import {
  computeFees,
  feeRuleSnapshot,
  type FeeRule,
  type ProviderFeeConfig,
} from "@/lib/payments/fees";
import type { DonationInput } from "@/lib/payments/validation";

export function providerFeeConfig(): ProviderFeeConfig {
  const env = serverEnv();
  return { bps: env.PUSHINPAY_FEE_BPS, minCents: env.PUSHINPAY_FEE_MIN_CENTS };
}

export async function getActiveFeeRule(): Promise<FeeRule> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fee_rules")
    .select("*")
    .lte("active_from", new Date().toISOString())
    .or(`active_to.is.null,active_to.gt.${new Date().toISOString()}`)
    .order("active_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    throw new Error("Nenhuma regra de taxa ativa configurada (fee_rules).");
  }
  return data;
}

function webhookUrl(): string {
  const secret = serverEnv().PUSHINPAY_WEBHOOK_SECRET || "sem-secret";
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  return `${base}/api/webhooks/pushinpay/${encodeURIComponent(secret)}`;
}

export type CreateDonationResult =
  | { ok: true; donationId: string }
  | { ok: false; error: string };

export async function createDonationWithCharge(params: {
  campaignId: string;
  donorUserId: string | null;
  input: DonationInput;
}): Promise<CreateDonationResult> {
  const admin = createAdminClient();
  const rule = await getActiveFeeRule();
  const provCfg = providerFeeConfig();

  let fees;
  try {
    fees = computeFees(params.input.amount, rule, provCfg);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const { data: donation, error: dErr } = await admin
    .from("donations")
    .insert({
      campaign_id: params.campaignId,
      donor_user_id: params.donorUserId,
      donor_name: params.input.anonymous
        ? null
        : params.input.donorName || null,
      anonymous: params.input.anonymous,
      message: params.input.message || null,
      gross_amount_cents: fees.grossCents,
      platform_fee_cents: fees.platformFeeCents,
      provider_fee_cents: fees.providerFeeCents,
      net_amount_cents: fees.netCents,
      payment_method: "pix",
      status: "created",
      fee_rule_id: rule.id ?? null,
      fee_rule_snapshot: feeRuleSnapshot(rule, provCfg),
    })
    .select("id")
    .single();
  if (dErr || !donation) {
    return { ok: false, error: "Não foi possível registrar a doação." };
  }

  const { error: pErr } = await admin.from("payments").insert({
    donation_id: donation.id,
    provider: "pushinpay",
    status: "created",
    amount_cents: fees.grossCents,
    provider_fee_cents: fees.providerFeeCents,
  });
  if (pErr) {
    await admin.from("donations").delete().eq("id", donation.id);
    return { ok: false, error: "Não foi possível iniciar a cobrança." };
  }

  try {
    const provider = getPixInProvider();
    const charge = await provider.createCharge({
      amountCents: fees.grossCents,
      webhookUrl: webhookUrl(),
      reference: donation.id,
    });

    await admin
      .from("payments")
      .update({
        provider_reference: charge.externalId,
        status: "pending",
        qr_code: charge.qrCode,
        qr_code_base64: charge.qrCodeBase64,
        expires_at: charge.expiresAt,
        raw_last_response: charge.raw as never,
      })
      .eq("donation_id", donation.id);
    await admin.from("donations").update({ status: "pending" }).eq("id", donation.id);
  } catch {
    await admin.from("payments").update({ status: "failed" }).eq("donation_id", donation.id);
    await admin.from("donations").update({ status: "failed" }).eq("id", donation.id);
    return {
      ok: false,
      error:
        "O provedor de pagamento recusou a cobrança agora. Tente novamente em instantes.",
    };
  }

  await writeAuditLog({
    actorUserId: params.donorUserId,
    action: "donation.created",
    entityType: "donation",
    entityId: donation.id,
    after: { campaign_id: params.campaignId, gross_amount_cents: fees.grossCents },
  });

  return { ok: true, donationId: donation.id };
}

/**
 * Reconfere o pagamento consultando o provedor (server-to-server) e aplica a
 * confirmação transacional idempotente. Usado pelo polling do frontend e como
 * rede de segurança se o webhook atrasar (doc §8.2/§8.3).
 */
export async function refreshDonationStatus(
  donationId: string,
): Promise<{ status: string }> {
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("provider, provider_reference, status")
    .eq("donation_id", donationId)
    .maybeSingle();

  if (!payment) return { status: "unknown" };
  if (["paid", "failed", "expired", "refunded", "chargeback"].includes(payment.status)) {
    return { status: payment.status };
  }
  if (!payment.provider_reference) return { status: payment.status };

  try {
    const provider = getPixInProvider();
    const charge = await provider.getCharge(payment.provider_reference);
    await admin.rpc("confirm_donation_payment", {
      p_provider: payment.provider,
      p_provider_reference: payment.provider_reference,
      p_provider_status: charge.status,
      p_amount_cents: Number.isFinite(charge.amountCents)
        ? charge.amountCents
        : (null as unknown as number),
      p_end_to_end_id: charge.endToEndId ?? undefined,
      p_payer_name: charge.payerName ?? undefined,
      p_payer_document: charge.payerDocument ?? undefined,
      p_raw: charge.raw as never,
    });
  } catch {
    // provedor indisponível — mantém o status atual
  }

  const { data: after } = await admin
    .from("payments")
    .select("status")
    .eq("donation_id", donationId)
    .maybeSingle();
  return { status: after?.status ?? payment.status };
}

/**
 * Processa um webhook do Pushin Pay de forma idempotente (doc §8.4, §20).
 * O corpo do webhook é só o GATILHO: a verdade vem de getCharge() autenticado.
 */
export async function processPushinPayWebhook(
  body: unknown,
): Promise<{ result: string; http: number }> {
  const provider = getPixInProvider();
  const event = provider.parseWebhook(body);
  if (!event) return { result: "invalid_payload", http: 400 };

  const admin = createAdminClient();
  const payloadHash = createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");

  const { error: insErr } = await admin.from("webhook_events").insert({
    provider: "pushinpay",
    event_id: event.eventId,
    payload_hash: payloadHash,
    payload: body as never,
    status: "processing",
  });
  // UNIQUE (provider, event_id) → repetição não reprocessa (idempotência).
  if (insErr) {
    if (insErr.code === "23505") return { result: "duplicate", http: 200 };
    return { result: "store_error", http: 200 };
  }

  const finish = async (status: string, error?: string) => {
    await admin
      .from("webhook_events")
      .update({
        status: error ? "error" : status === "ignored" ? "ignored" : "processed",
        error: error ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("provider", "pushinpay")
      .eq("event_id", event.eventId);
  };

  const { data: payment } = await admin
    .from("payments")
    .select("provider_reference")
    .eq("provider", "pushinpay")
    .eq("provider_reference", event.externalId)
    .maybeSingle();
  if (!payment) {
    await finish("ignored");
    return { result: "unknown_charge", http: 200 };
  }

  try {
    const charge = await provider.getCharge(event.externalId);
    const outcome = await admin.rpc("confirm_donation_payment", {
      p_provider: "pushinpay",
      p_provider_reference: event.externalId,
      p_provider_status: charge.status,
      p_amount_cents: Number.isFinite(charge.amountCents)
        ? charge.amountCents
        : (null as unknown as number),
      p_end_to_end_id: charge.endToEndId ?? undefined,
      p_payer_name: charge.payerName ?? undefined,
      p_payer_document: charge.payerDocument ?? undefined,
      p_raw: charge.raw as never,
    });
    await finish("processed");
    return { result: String(outcome.data ?? "processed"), http: 200 };
  } catch (e) {
    await finish("processed", (e as Error).message);
    // 200 mesmo assim: o provedor reenviará; o polling também cobre.
    return { result: "verify_failed", http: 200 };
  }
}
