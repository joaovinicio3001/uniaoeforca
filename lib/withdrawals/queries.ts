import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export type PixKeyRow = Database["public"]["Tables"]["pix_keys"]["Row"];
export type WithdrawalRow = Database["public"]["Tables"]["withdrawals"]["Row"];
export type WithdrawalStatus =
  Database["public"]["Enums"]["withdrawal_status"];

export async function listMyPixKeys(): Promise<PixKeyRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("pix_keys")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "disabled")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listMyWithdrawals(): Promise<WithdrawalRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("user_id", user.id)
    .order("requested_at", { ascending: false });
  return data ?? [];
}

export async function getMyWithdrawal(id: string) {
  const supabase = await createClient();
  const { data: w } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!w) return null;
  const { data: events } = await supabase
    .from("withdrawal_events")
    .select("from_status, to_status, reason, created_at")
    .eq("withdrawal_id", id)
    .order("created_at", { ascending: true });
  return { withdrawal: w, events: events ?? [] };
}

// ---------- admin ----------
export async function listWithdrawalsQueue(statuses: WithdrawalStatus[]) {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("withdrawals")
    .select(
      "id, amount_cents, net_cents, fee_cents, status, requested_at, user_id, pix_key_snapshot",
    )
    .in("status", statuses)
    .order("requested_at", { ascending: true })
    .limit(200);
  return data ?? [];
}

export async function getWithdrawalForReview(id: string) {
  if (!hasServiceRole()) return null;
  const admin = createAdminClient();
  const { data: w } = await admin
    .from("withdrawals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!w) return null;

  const [{ data: profile }, { data: payout }, { data: events }, { data: bal }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("full_name, cpf_last3, status")
        .eq("id", w.user_id)
        .maybeSingle(),
      admin
        .from("provider_payouts")
        .select("provider, provider_reference, status, end_to_end_id, failure_reason, external_fee_cents")
        .eq("withdrawal_id", id)
        .maybeSingle(),
      admin
        .from("withdrawal_events")
        .select("from_status, to_status, reason, created_at, actor_user_id")
        .eq("withdrawal_id", id)
        .order("created_at", { ascending: true }),
      admin
        .from("wallet_balances")
        .select("available_cents, reserved_cents")
        .eq("wallet_id", w.wallet_id)
        .maybeSingle(),
    ]);

  return {
    withdrawal: w,
    profile: profile ?? null,
    payout: payout ?? null,
    events: events ?? [],
    balance: bal ?? null,
  };
}
