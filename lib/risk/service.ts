import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/security/audit";
import type { Database } from "@/lib/database.types";

export type RiskFlag = Database["public"]["Tables"]["risk_flags"]["Row"];

export async function listOpenRiskFlags(limit = 100) {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("risk_flags")
    .select("*")
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listRiskFlagsForWithdrawal(withdrawalId: string) {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("risk_flags")
    .select("id, type, severity, status, details, created_at")
    .eq("withdrawal_id", withdrawalId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function resolveRiskFlag(params: {
  flagId: string;
  decision: "resolved" | "dismissed";
  note?: string;
  actorId: string;
}) {
  const admin = createAdminClient();
  await admin
    .from("risk_flags")
    .update({
      status: params.decision,
      resolution_note: params.note ?? null,
      resolved_by: params.actorId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.flagId);
  await writeAuditLog({
    actorUserId: params.actorId,
    action: `risk_flag.${params.decision}`,
    entityType: "risk_flag",
    entityId: params.flagId,
  });
}

export async function setUserBlock(params: {
  userId: string;
  reason: string;
  blocked: boolean;
  actorId: string;
}) {
  const admin = createAdminClient();
  await admin.rpc("set_user_block", {
    p_user_id: params.userId,
    p_reason: params.reason,
    p_actor: params.actorId,
    p_blocked: params.blocked,
  });
}

export async function placeHold(params: {
  walletId: string;
  amountCents: number;
  reason: string;
  actorId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data } = await admin.rpc("place_wallet_hold", {
    p_wallet_id: params.walletId,
    p_amount_cents: params.amountCents,
    p_reason: params.reason,
    p_actor: params.actorId,
  });
  const res = data as { ok: boolean; error?: string };
  if (res?.ok) {
    await writeAuditLog({
      actorUserId: params.actorId,
      action: "wallet.hold_placed",
      entityType: "wallet",
      entityId: params.walletId,
      after: { amount_cents: params.amountCents, reason: params.reason },
    });
  }
  return { ok: !!res?.ok, error: res?.error };
}

export async function releaseHold(holdId: string, actorId: string) {
  const admin = createAdminClient();
  const { data } = await admin.rpc("release_wallet_hold", {
    p_hold_id: holdId,
    p_actor: actorId,
  });
  const r = String(data ?? "error");
  if (r === "ok") {
    await writeAuditLog({
      actorUserId: actorId,
      action: "wallet.hold_released",
      entityType: "wallet_hold",
      entityId: holdId,
    });
  }
  return r;
}

export async function listBlocklist() {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("blocklist")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}
