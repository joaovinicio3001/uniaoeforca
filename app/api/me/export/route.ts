import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Portabilidade de dados (LGPD §16). Exporta os dados do usuário logado. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const [profile, campaigns, donations, withdrawals, kyc, pixKeys, notifications] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("campaigns").select("*").eq("owner_user_id", user.id),
      supabase.from("donations").select("*").eq("donor_user_id", user.id),
      supabase.from("withdrawals").select("*").eq("user_id", user.id),
      supabase.from("kyc_cases").select("id, level, status, submitted_at, reviewed_at").eq("user_id", user.id),
      supabase.from("pix_keys").select("id, type, value_masked, status, created_at").eq("user_id", user.id),
      supabase.from("notifications").select("*").eq("user_id", user.id),
    ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    campaigns: campaigns.data ?? [],
    donations: donations.data ?? [],
    withdrawals: withdrawals.data ?? [],
    kyc_cases: kyc.data ?? [],
    pix_keys: pixKeys.data ?? [],
    notifications: notifications.data ?? [],
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="uniaoeforca-meus-dados-${user.id.slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
