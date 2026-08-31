import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import type { AppRole } from "@/lib/auth/rbac";

export type UserListItem = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  cpf_last3: string | null;
  status: string;
  created_at: string;
  email: string | null;
};

function sanitizeQ(q: string): string {
  return q.replace(/[(),]/g, " ").trim();
}

/** Mapa id → e-mail a partir do Auth (plataforma pequena: 1 página basta). */
async function emailMap(): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return new Map((data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
}

export async function listUsers(
  rawQ: string,
  limit = 50,
): Promise<UserListItem[]> {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const emails = await emailMap();
  const q = sanitizeQ(rawQ);

  let query = admin
    .from("profiles")
    .select("id, full_name, display_name, cpf_last3, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    const ors: string[] = [
      `full_name.ilike.%${q}%`,
      `display_name.ilike.%${q}%`,
    ];
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 2 && digits.length <= 3) {
      ors.push(`cpf_last3.eq.${digits}`);
    }
    if (q.includes("@") || /^[\w.-]+$/.test(q)) {
      const ids = [...emails.entries()]
        .filter(([, e]) => e.toLowerCase().includes(q.toLowerCase()))
        .map(([id]) => id)
        .slice(0, 100);
      if (ids.length) ors.push(`id.in.(${ids.join(",")})`);
    }
    query = query.or(ors.join(","));
  }

  const { data } = await query;
  return (data ?? []).map((p) => ({
    ...p,
    email: emails.get(p.id) ?? null,
  }));
}

export type UserDossier = {
  profile: {
    id: string;
    full_name: string | null;
    display_name: string | null;
    cpf_last3: string | null;
    birth_date: string | null;
    phone: string | null;
    address_city: string | null;
    address_state: string | null;
    status: string;
    marketing_opt_in: boolean | null;
    terms_accepted_at: string | null;
    created_at: string;
  };
  email: string | null;
  auth: {
    created_at: string | null;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    banned_until: string | null;
  };
  roles: AppRole[];
  campaigns: {
    id: string;
    title: string;
    status: string;
    goal_amount_cents: number;
    raised_amount_cents: number;
    created_at: string;
  }[];
  donations: { count: number; totalGrossCents: number };
  wallet: {
    pending_cents: number;
    available_cents: number;
    reserved_cents: number;
    held_cents: number;
    withdrawn_cents: number;
  } | null;
  withdrawals: {
    id: string;
    amount_cents: number;
    net_cents: number;
    status: string;
    requested_at: string;
  }[];
  kyc: {
    level: string;
    status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
  } | null;
  audit: {
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
  }[];
};

export async function getUserDossier(
  userId: string,
): Promise<UserDossier | null> {
  if (!hasServiceRole()) return null;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, full_name, display_name, cpf_last3, birth_date, phone, address_city, address_state, status, marketing_opt_in, terms_accepted_at, created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  const { data: wallet } = await admin
    .from("wallets")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const [
    authRes,
    { data: roleRows },
    { data: campaigns },
    { data: donationRows },
    { data: balance },
    { data: withdrawals },
    { data: kycRows },
    { data: audit },
  ] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("user_roles").select("role").eq("user_id", userId),
    admin
      .from("campaigns")
      .select(
        "id, title, status, goal_amount_cents, raised_amount_cents, created_at",
      )
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false }),
    admin
      .from("donations")
      .select("gross_amount_cents")
      .eq("donor_user_id", userId)
      .eq("status", "paid"),
    wallet
      ? admin
          .from("wallet_balances")
          .select(
            "pending_cents, available_cents, reserved_cents, held_cents, withdrawn_cents",
          )
          .eq("wallet_id", wallet.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("withdrawals")
      .select("id, amount_cents, net_cents, status, requested_at")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .limit(20),
    admin
      .from("kyc_cases")
      .select("level, status, submitted_at, reviewed_at, rejection_reason")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("audit_logs")
      .select("action, entity_type, entity_id, created_at")
      .or(`actor_user_id.eq.${userId},entity_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const authUser = authRes.data?.user;
  const donations = donationRows ?? [];

  return {
    profile,
    email: authUser?.email ?? null,
    auth: {
      created_at: authUser?.created_at ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null,
      banned_until:
        (authUser as { banned_until?: string } | undefined)?.banned_until ??
        null,
    },
    roles: (roleRows ?? []).map((r) => r.role as AppRole),
    campaigns: campaigns ?? [],
    donations: {
      count: donations.length,
      totalGrossCents: donations.reduce(
        (s, d) => s + d.gross_amount_cents,
        0,
      ),
    },
    wallet: balance ?? null,
    withdrawals: withdrawals ?? [],
    kyc: kycRows?.[0] ?? null,
    audit: audit ?? [],
  };
}
