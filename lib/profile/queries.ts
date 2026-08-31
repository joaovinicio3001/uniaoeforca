import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMyKycSummary } from "@/lib/kyc/queries";

export type VerificationBadge = "verified" | "in_review" | "pending";

export type MyProfile = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  fullName: string;
  displayName: string | null;
  birthDate: string | null; // yyyy-mm-dd
  phone: string | null;
  cpfMasked: string | null;
  avatarUrl: string | null;
  createdAt: string;
  verification: VerificationBadge;
  prefs: {
    campaignActivity: boolean;
    platformUpdates: boolean;
  };
  summary: {
    campaignsCreated: number;
    totalContributedCents: number;
  };
};

/**
 * Perfil consolidado do usuário autenticado. Uma leitura da tabela `profiles`
 * + resumo de verificação + contagens agregadas (sem N+1).
 */
export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, kyc, campaigns, { data: donationRows }] =
    await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, display_name, birth_date, phone, cpf_last3, avatar_url, created_at, marketing_opt_in, notify_campaign_activity",
      )
      .eq("id", user.id)
      .maybeSingle(),
    getMyKycSummary(),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id),
    supabase
      .from("donations")
      .select("gross_amount_cents")
      .eq("donor_user_id", user.id)
      .eq("status", "paid"),
  ]);

  if (!profile) return null;

  const verification: VerificationBadge =
    kyc.hasBasic && kyc.hasEnhanced
      ? "verified"
      : ["pending", "in_review"].includes(kyc.latestStatus ?? "")
        ? "in_review"
        : "pending";

  const totalContributedCents = (donationRows ?? []).reduce(
    (s, d) => s + (d.gross_amount_cents ?? 0),
    0,
  );

  return {
    id: user.id,
    email: user.email ?? null,
    emailVerified: !!user.email_confirmed_at,
    fullName: profile.full_name,
    displayName: profile.display_name,
    birthDate: profile.birth_date,
    phone: profile.phone,
    cpfMasked: profile.cpf_last3 ? `***.***.${profile.cpf_last3}-**` : null,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    verification,
    prefs: {
      campaignActivity: profile.notify_campaign_activity,
      platformUpdates: profile.marketing_opt_in,
    },
    summary: {
      campaignsCreated: campaigns.count ?? 0,
      totalContributedCents,
    },
  };
}
