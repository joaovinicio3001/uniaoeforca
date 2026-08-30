import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";
import {
  summarizeTrialBalance,
  type TrialBalanceRow,
} from "@/lib/ledger/trial-balance";

export type WalletBalance = {
  pending_cents: number;
  available_cents: number;
  reserved_cents: number;
  held_cents: number;
  withdrawn_cents: number;
};

const ZERO: WalletBalance = {
  pending_cents: 0,
  available_cents: 0,
  reserved_cents: 0,
  held_cents: 0,
  withdrawn_cents: 0,
};

export async function getMyWalletBalance(): Promise<WalletBalance> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return ZERO;

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!wallet) return ZERO;

  const { data } = await supabase
    .from("wallet_balances")
    .select("pending_cents, available_cents, reserved_cents, held_cents, withdrawn_cents")
    .eq("wallet_id", wallet.id)
    .maybeSingle();
  return data ?? ZERO;
}

export type LedgerLine = {
  posted_at: string;
  description: string;
  reference_type: string;
  account_code: string;
  direction: "debit" | "credit";
  amount_cents: number;
};

/** Extrato da carteira do usuário logado (doc §21.3). */
export async function getMyWalletStatement(limit = 50): Promise<LedgerLine[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!wallet) return [];

  // Contas da carteira → entradas → transações.
  const { data: accounts } = await supabase
    .from("ledger_accounts")
    .select("id, code")
    .eq("wallet_id", wallet.id);
  const codeById = new Map((accounts ?? []).map((a) => [a.id, a.code]));
  if (codeById.size === 0) return [];

  const { data: entries } = await supabase
    .from("ledger_entries")
    .select("account_id, direction, amount_cents, transaction_id")
    .in("account_id", [...codeById.keys()])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!entries?.length) return [];

  const txIds = [...new Set(entries.map((e) => e.transaction_id))];
  const { data: txs } = await supabase
    .from("ledger_transactions")
    .select("id, posted_at, description, reference_type")
    .in("id", txIds);
  const txById = new Map((txs ?? []).map((t) => [t.id, t]));

  return entries.map((e) => {
    const t = txById.get(e.transaction_id);
    return {
      posted_at: t?.posted_at ?? "",
      description: t?.description ?? "",
      reference_type: t?.reference_type ?? "",
      account_code: codeById.get(e.account_id) ?? "?",
      direction: e.direction as "debit" | "credit",
      amount_cents: e.amount_cents,
    };
  });
}

/** Balancete global (staff). Usa service_role para ver todas as contas. */
export async function getTrialBalance() {
  if (!hasServiceRole()) return null;
  const user = await getSessionUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin.from("v_ledger_trial_balance").select("*");
  const { data: imbalanced } = await admin
    .from("v_ledger_imbalanced")
    .select("transaction_id, idempotency_key, delta_cents");

  return {
    summary: summarizeTrialBalance((data ?? []) as TrialBalanceRow[]),
    imbalanced: imbalanced ?? [],
  };
}

/** Totais financeiros de uma campanha (dono/staff), reconciliáveis com o ledger. */
export async function getCampaignLedgerTotals(campaignId: string) {
  const supabase = await createClient();
  const { data: donations } = await supabase
    .from("donations")
    .select("net_amount_cents, platform_fee_cents, provider_fee_cents, status")
    .eq("campaign_id", campaignId)
    .eq("status", "paid");

  const rows = donations ?? [];
  return {
    netCents: rows.reduce((s, d) => s + d.net_amount_cents, 0),
    platformFeeCents: rows.reduce((s, d) => s + d.platform_fee_cents, 0),
    providerFeeCents: rows.reduce((s, d) => s + d.provider_fee_cents, 0),
    count: rows.length,
  };
}
