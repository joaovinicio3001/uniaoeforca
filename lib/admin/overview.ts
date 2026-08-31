import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";

export type AdminOverview = {
  gmvTotalCents: number;
  gmv30dCents: number;
  revenueTotalCents: number;
  revenue30dCents: number;
  donationsPaidTotal: number;
  donationsPaid30d: number;
  campaignsActive: number;
  campaignsPendingReview: number;
  withdrawalsQueue: number;
  withdrawalsProcessing: number;
  withdrawalsOpenAmountCents: number;
  kycPending: number;
  riskOpen: number;
  reportsOpen: number;
  reconOpen: number;
  ledgerImbalanced: number | null;
  usersTotal: number;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getAdminOverview(): Promise<AdminOverview | null> {
  if (!hasServiceRole()) return null;
  const admin = createAdminClient();
  const cutoff = Date.now() - THIRTY_DAYS_MS;

  const [
    { data: paidDonations },
    campaignsActive,
    campaignsPending,
    wdQueue,
    wdProcessing,
    kycPending,
    riskOpen,
    reportsOpen,
    reconOpen,
    usersTotal,
    imbalanced,
  ] = await Promise.all([
    admin
      .from("donations")
      .select("gross_amount_cents, platform_fee_cents, paid_at")
      .eq("status", "paid"),
    admin
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review"),
    admin
      .from("withdrawals")
      .select("net_cents", { count: "exact" })
      .in("status", ["requested", "under_review"]),
    admin
      .from("withdrawals")
      .select("net_cents", { count: "exact" })
      .eq("status", "processing"),
    admin
      .from("kyc_cases")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "in_review"]),
    admin
      .from("risk_flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "reviewing"]),
    admin
      .from("reconciliation_items")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(resolved,matched)"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("v_ledger_imbalanced")
      .select("transaction_id", { count: "exact", head: true }),
  ]);

  const donations = paidDonations ?? [];
  let gmvTotal = 0;
  let gmv30 = 0;
  let revTotal = 0;
  let rev30 = 0;
  let count30 = 0;
  for (const d of donations) {
    gmvTotal += d.gross_amount_cents;
    revTotal += d.platform_fee_cents;
    const t = d.paid_at ? Date.parse(d.paid_at) : 0;
    if (t >= cutoff) {
      gmv30 += d.gross_amount_cents;
      rev30 += d.platform_fee_cents;
      count30 += 1;
    }
  }

  const openAmount =
    (wdQueue.data ?? []).reduce((s, r) => s + (r.net_cents ?? 0), 0) +
    (wdProcessing.data ?? []).reduce((s, r) => s + (r.net_cents ?? 0), 0);

  return {
    gmvTotalCents: gmvTotal,
    gmv30dCents: gmv30,
    revenueTotalCents: revTotal,
    revenue30dCents: rev30,
    donationsPaidTotal: donations.length,
    donationsPaid30d: count30,
    campaignsActive: campaignsActive.count ?? 0,
    campaignsPendingReview: campaignsPending.count ?? 0,
    withdrawalsQueue: wdQueue.count ?? 0,
    withdrawalsProcessing: wdProcessing.count ?? 0,
    withdrawalsOpenAmountCents: openAmount,
    kycPending: kycPending.count ?? 0,
    riskOpen: riskOpen.count ?? 0,
    reportsOpen: reportsOpen.count ?? 0,
    reconOpen: reconOpen.count ?? 0,
    ledgerImbalanced: imbalanced.count ?? null,
    usersTotal: usersTotal.count ?? 0,
  };
}

export type AdminQueues = {
  withdrawals: {
    id: string;
    amount_cents: number;
    status: string;
    requested_at: string;
  }[];
  campaigns: {
    id: string;
    title: string;
    goal_amount_cents: number;
    created_at: string;
  }[];
  kyc: {
    id: string;
    user_id: string;
    level: string;
    status: string;
    submitted_at: string | null;
  }[];
  audit: { action: string; entity_type: string; created_at: string }[];
};

export async function getAdminQueues(): Promise<AdminQueues | null> {
  if (!hasServiceRole()) return null;
  const admin = createAdminClient();

  const [{ data: withdrawals }, { data: campaigns }, { data: kyc }, { data: audit }] =
    await Promise.all([
      admin
        .from("withdrawals")
        .select("id, amount_cents, status, requested_at")
        .in("status", ["requested", "under_review"])
        .order("requested_at", { ascending: true })
        .limit(8),
      admin
        .from("campaigns")
        .select("id, title, goal_amount_cents, created_at")
        .eq("status", "pending_review")
        .order("created_at", { ascending: true })
        .limit(8),
      admin
        .from("kyc_cases")
        .select("id, user_id, level, status, submitted_at")
        .in("status", ["pending", "in_review"])
        .order("submitted_at", { ascending: true })
        .limit(8),
      admin
        .from("audit_logs")
        .select("action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  return {
    withdrawals: withdrawals ?? [],
    campaigns: campaigns ?? [],
    kyc: kyc ?? [],
    audit: audit ?? [],
  };
}
