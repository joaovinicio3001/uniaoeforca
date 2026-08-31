import "server-only";

import { createClient as createSbClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv, serverEnv } from "@/lib/env";
import { writeAuditLog } from "@/lib/security/audit";
import { encryptSecret, decryptSecret, hashSecret } from "@/lib/security/crypto";
import { getPixOutProvider } from "@/lib/payments/pixout";
import {
  maskPixKey,
  toProviderKeyType,
  type PixKeyType,
} from "@/lib/withdrawals/pix-keys";
import type { AddPixKeyInput } from "@/lib/withdrawals/validation";

// ---------- reautenticação leve (doc §6.2, §11.4) ----------
export async function verifyPassword(
  email: string,
  password: string,
): Promise<boolean> {
  const sb = createSbClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return !error;
}

// ---------- chaves PIX ----------
export async function addPixKey(params: {
  userId: string;
  input: AddPixKeyInput;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { userId, input } = params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("pix_keys")
    .insert({
      user_id: userId,
      type: input.type,
      value_encrypted: encryptSecret(input.value),
      value_hash: hashSecret(input.value),
      value_masked: maskPixKey(input.type, input.value),
      owner_name: input.ownerName || null,
      // Verificação de titularidade real (nome/microdepósito) é Fase 5.
      status: "verified",
      verified_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Você já cadastrou essa chave." };
    }
    return { ok: false, error: "Não foi possível cadastrar a chave." };
  }
  await writeAuditLog({
    actorUserId: userId,
    action: "pix_key.added",
    entityType: "pix_key",
    entityId: data.id,
    after: { type: input.type },
  });
  return { ok: true, id: data.id };
}

export async function disablePixKey(userId: string, keyId: string) {
  const admin = createAdminClient();
  // Bloqueia se há saque em aberto usando a chave.
  const { count } = await admin
    .from("withdrawals")
    .select("id", { count: "exact", head: true })
    .eq("pix_key_id", keyId)
    .in("status", ["requested", "under_review", "approved", "processing"]);
  if ((count ?? 0) > 0) {
    return { ok: false, error: "Há um saque em andamento com essa chave." };
  }
  await admin
    .from("pix_keys")
    .update({ status: "disabled", disabled_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", userId);
  await writeAuditLog({
    actorUserId: userId,
    action: "pix_key.disabled",
    entityType: "pix_key",
    entityId: keyId,
  });
  return { ok: true };
}

// ---------- solicitação de saque ----------
export async function requestWithdrawal(params: {
  userId: string;
  pixKeyId: string;
  amountCents: number;
  campaignId?: string | null;
}): Promise<{
  ok: boolean;
  error?: string;
  withdrawalId?: string;
  kycRequired?: string;
}> {
  const env = serverEnv();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("request_withdrawal", {
    p_user_id: params.userId,
    p_pix_key_id: params.pixKeyId,
    p_amount_cents: params.amountCents,
    p_campaign_id: params.campaignId ?? undefined,
    p_cooldown_hours: env.WITHDRAWAL_PIX_KEY_COOLDOWN_HOURS,
    p_daily_max_cents: env.WITHDRAWAL_DAILY_MAX_CENTS,
    p_min_cents: env.WITHDRAWAL_MIN_CENTS,
    p_max_cents: env.WITHDRAWAL_MAX_CENTS,
    p_enhanced_kyc_cents: env.KYC_ENHANCED_THRESHOLD_CENTS,
  });
  if (error) return { ok: false, error: "Falha ao registrar a solicitação." };

  const res = data as {
    ok: boolean;
    error?: string;
    withdrawal_id?: string;
    kyc_required?: string;
  };
  if (!res.ok) return { ok: false, error: res.error, kycRequired: res.kyc_required };

  await writeAuditLog({
    actorUserId: params.userId,
    action: "withdrawal.requested",
    entityType: "withdrawal",
    entityId: res.withdrawal_id ?? null,
    after: { amount_cents: params.amountCents },
  });
  return { ok: true, withdrawalId: res.withdrawal_id };
}

// ---------- transições administrativas ----------
export async function staffTransition(params: {
  withdrawalId: string;
  to: "under_review" | "approved" | "rejected";
  actorUserId: string;
  reason?: string;
}): Promise<{ ok: boolean; result: string }> {
  const admin = createAdminClient();
  const { data } = await admin.rpc("transition_withdrawal", {
    p_withdrawal_id: params.withdrawalId,
    p_to: params.to,
    p_actor_user_id: params.actorUserId,
    p_actor: "staff",
    p_reason: params.reason ?? undefined,
    p_high_value_cents:
      params.to === "approved"
        ? serverEnv().WITHDRAWAL_HIGH_VALUE_CENTS
        : undefined,
  });
  const result = String(data ?? "error");
  if (result === "ok") {
    await writeAuditLog({
      actorUserId: params.actorUserId,
      action: `withdrawal.${params.to}`,
      entityType: "withdrawal",
      entityId: params.withdrawalId,
      after: { reason: params.reason ?? null },
    });
  }
  return { ok: result === "ok", result };
}

function webhookUrl(): string {
  const secret = serverEnv().GGPIX_WEBHOOK_SECRET || "sem-secret";
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  return `${base}/api/webhooks/ggpix/${encodeURIComponent(secret)}`;
}

/**
 * Após aprovação: cria o payout no provedor e move para "processing".
 * O admin NÃO redigita valor/chave — tudo vem do withdrawal persistido (§34.4).
 */
export async function dispatchPayout(
  withdrawalId: string,
  actorUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: w } = await admin
    .from("withdrawals")
    .select("id, status, net_cents, pix_key_id, campaign_id")
    .eq("id", withdrawalId)
    .maybeSingle();
  if (!w || w.status !== "approved") {
    return { ok: false, error: "Saque não está aprovado." };
  }

  const { data: existing } = await admin
    .from("provider_payouts")
    .select("id")
    .eq("withdrawal_id", withdrawalId)
    .maybeSingle();
  if (existing) return { ok: false, error: "Payout já iniciado." };

  const { data: key } = await admin
    .from("pix_keys")
    .select("type, value_encrypted, owner_name")
    .eq("id", w.pix_key_id)
    .maybeSingle();
  if (!key) return { ok: false, error: "Chave PIX não encontrada." };

  const pixKeyValue = decryptSecret(key.value_encrypted);
  const provider = getPixOutProvider();
  let payout;
  try {
    payout = await provider.createPayout({
      amountCents: w.net_cents,
      pixKey: pixKeyValue,
      pixKeyType: toProviderKeyType(key.type as PixKeyType),
      // A chave é sempre o CPF do titular — informamos ao provedor para a
      // validação de titularidade no PIX Out.
      recipientDocument:
        key.type === "cpf" ? pixKeyValue.replace(/\D/g, "") : undefined,
      externalId: w.id,
      description: `Saque União & Força ${w.id.slice(0, 8)}`,
      webhookUrl: webhookUrl(),
    });
  } catch (e) {
    await writeAuditLog({
      actorUserId,
      action: "withdrawal.payout_error",
      entityType: "withdrawal",
      entityId: withdrawalId,
      after: { error: (e as Error).message },
    });
    return { ok: false, error: "Provedor de PIX Out recusou a solicitação agora." };
  }

  await admin.from("provider_payouts").insert({
    withdrawal_id: w.id,
    provider: provider.name,
    provider_reference: payout.externalRef,
    status: "pending",
    external_fee_cents: payout.feeCents,
    raw_last_response: payout.raw as never,
  });

  await admin.rpc("transition_withdrawal", {
    p_withdrawal_id: w.id,
    p_to: "processing",
    p_actor_user_id: actorUserId,
    p_actor: "system",
  });

  await writeAuditLog({
    actorUserId,
    action: "withdrawal.processing",
    entityType: "withdrawal",
    entityId: withdrawalId,
    after: { provider: provider.name, ref: payout.externalRef },
  });

  // Se não for mock, tenta já reconfirmar (pode ter concluído na hora).
  if (!provider.isMock) await refreshPayoutStatus(withdrawalId);
  return { ok: true };
}

/** Reconfirma o payout consultando o provedor (server-to-server) — doc §8.3. */
export async function refreshPayoutStatus(
  withdrawalId: string,
): Promise<{ status: string }> {
  const admin = createAdminClient();
  const { data: po } = await admin
    .from("provider_payouts")
    .select("provider, provider_reference, status")
    .eq("withdrawal_id", withdrawalId)
    .maybeSingle();
  if (!po?.provider_reference) return { status: "unknown" };
  if (["paid", "failed"].includes(po.status)) return { status: po.status };

  const provider = getPixOutProvider();
  if (provider.isMock) return { status: po.status };

  try {
    const st = await provider.getPayout(po.provider_reference);
    await admin.rpc("confirm_withdrawal_payout", {
      p_provider: po.provider,
      p_provider_reference: po.provider_reference,
      p_provider_status: st.status,
      p_amount_cents: st.netAmountCents ?? st.amountCents ?? (null as unknown as number),
      p_end_to_end_id: st.endToEndId ?? undefined,
      p_failure_reason: st.failureReason ?? undefined,
      p_external_fee_cents: st.feeCents ?? undefined,
      p_raw: st.raw as never,
    });
  } catch {
    /* provedor indisponível — mantém status */
  }
  const { data: after } = await admin
    .from("provider_payouts")
    .select("status")
    .eq("withdrawal_id", withdrawalId)
    .maybeSingle();
  return { status: after?.status ?? po.status };
}

/** Mock only: simula o desfecho do PIX Out (admin). */
export async function simulatePayoutOutcome(
  withdrawalId: string,
  outcome: "complete" | "failed",
): Promise<string> {
  const provider = getPixOutProvider();
  if (!provider.isMock) return "not_mock";
  const admin = createAdminClient();
  const { data: po } = await admin
    .from("provider_payouts")
    .select("provider, provider_reference")
    .eq("withdrawal_id", withdrawalId)
    .maybeSingle();
  if (!po?.provider_reference) return "no_payout";

  const { data: w } = await admin
    .from("withdrawals")
    .select("net_cents")
    .eq("id", withdrawalId)
    .maybeSingle();

  const { data } = await admin.rpc("confirm_withdrawal_payout", {
    p_provider: po.provider,
    p_provider_reference: po.provider_reference,
    p_provider_status: outcome,
    p_amount_cents: w?.net_cents ?? (null as unknown as number),
    p_end_to_end_id: outcome === "complete" ? `MOCK-${withdrawalId.slice(0, 8)}` : undefined,
    p_failure_reason: outcome === "failed" ? "Falha simulada (mock)" : undefined,
    p_raw: { mock: true, outcome } as never,
  });
  return String(data ?? "error");
}

/** Webhook GGPix — gatilho; verdade vem do GET autenticado (doc §8.3). */
export async function processGGPixWebhook(
  body: unknown,
): Promise<{ result: string; http: number }> {
  const provider = getPixOutProvider();
  const event = provider.parseWebhook(body);
  if (!event) return { result: "invalid_payload", http: 400 };

  const admin = createAdminClient();
  const { data: po } = await admin
    .from("provider_payouts")
    .select("provider, provider_reference, status")
    .eq("provider_reference", event.externalRef)
    .maybeSingle();
  if (!po) return { result: "unknown_payout", http: 200 };
  if (["paid", "failed"].includes(po.status)) return { result: "duplicate", http: 200 };

  try {
    const st = await provider.getPayout(event.externalRef);
    const { data } = await admin.rpc("confirm_withdrawal_payout", {
      p_provider: po.provider,
      p_provider_reference: event.externalRef,
      p_provider_status: st.status,
      p_amount_cents: st.netAmountCents ?? st.amountCents ?? (null as unknown as number),
      p_end_to_end_id: st.endToEndId ?? undefined,
      p_failure_reason: st.failureReason ?? undefined,
      p_external_fee_cents: st.feeCents ?? undefined,
      p_raw: st.raw as never,
    });
    return { result: String(data ?? "processed"), http: 200 };
  } catch (e) {
    return { result: `verify_failed:${(e as Error).message.slice(0, 80)}`, http: 200 };
  }
}
