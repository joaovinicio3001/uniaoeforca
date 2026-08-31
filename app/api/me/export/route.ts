import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { writeAuditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/**
 * Portabilidade de dados (LGPD, art. 18). Exporta os dados pessoais do usuário
 * autenticado — a identidade vem sempre da sessão, nunca de um parâmetro.
 *
 * NÃO exporta: hash/valor cifrado de CPF, tokens, segredos, dados de risco/
 * antifraude, documentos de identidade, nem dados pessoais de terceiros.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const rl = rateLimit(`data-export:${user.id}`, {
    limit: 5,
    windowSeconds: 3600,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas exportações. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const [
    { data: profile },
    { data: campaigns },
    { data: donations },
    { data: withdrawals },
    { data: kyc },
    { data: pixKeys },
    { data: notifications },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, display_name, birth_date, phone, cpf_last3, avatar_url, status, marketing_opt_in, notify_campaign_activity, terms_accepted_at, cep, address_street, address_number, address_complement, address_district, address_city, address_state, created_at",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select(
        "id, title, slug, summary, story, goal_amount_cents, raised_amount_cents, supporters_count, status, visibility, city, state, created_at, published_at, ended_at, updated_at",
      )
      .eq("owner_user_id", user.id),
    supabase
      .from("donations")
      .select(
        "id, donor_name, anonymous, message, gross_amount_cents, platform_fee_cents, provider_fee_cents, net_amount_cents, payment_method, status, created_at, paid_at, campaigns(title, slug)",
      )
      .eq("donor_user_id", user.id),
    supabase
      .from("withdrawals")
      .select(
        "id, amount_cents, fee_cents, net_cents, status, pix_key_snapshot, rejection_reason, failure_reason, requested_at, approved_at, paid_at, rejected_at",
      )
      .eq("user_id", user.id),
    supabase
      .from("kyc_cases")
      .select(
        "level, status, submitted_at, reviewed_at, approved_at, expires_at, rejection_reason",
      )
      .eq("user_id", user.id),
    supabase
      .from("pix_keys")
      .select("type, value_masked, status, created_at")
      .eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("type, payload, created_at")
      .eq("user_id", user.id),
  ]);

  const cpfMasked = profile?.cpf_last3
    ? `***.***.${profile.cpf_last3}-**`
    : null;

  const body = {
    exported_at: new Date().toISOString(),
    aviso:
      "Arquivo gerado para a conta autenticada. Não contém senhas, tokens, dados de segurança nem dados de terceiros.",
    account: {
      id: user.id,
      email: user.email,
      email_verified: !!user.email_confirmed_at,
      created_at: user.created_at,
      full_name: profile?.full_name ?? null,
      display_name: profile?.display_name ?? null,
      cpf: cpfMasked,
      birth_date: profile?.birth_date ?? null,
      phone: profile?.phone ?? null,
      avatar_url: profile?.avatar_url ?? null,
      status: profile?.status ?? null,
      terms_accepted_at: profile?.terms_accepted_at ?? null,
      endereco: {
        cep: profile?.cep ?? null,
        rua: profile?.address_street ?? null,
        numero: profile?.address_number ?? null,
        complemento: profile?.address_complement ?? null,
        bairro: profile?.address_district ?? null,
        cidade: profile?.address_city ?? null,
        estado: profile?.address_state ?? null,
      },
    },
    preferences: {
      emails_campanhas: profile?.notify_campaign_activity ?? null,
      atualizacoes_plataforma: profile?.marketing_opt_in ?? null,
    },
    campaigns: campaigns ?? [],
    contributions: donations ?? [],
    withdrawals: withdrawals ?? [],
    verification: kyc ?? [],
    pix_keys: pixKeys ?? [],
    notifications: notifications ?? [],
  };

  await writeAuditLog({
    actorUserId: user.id,
    action: "lgpd.export_downloaded",
    entityType: "user",
    entityId: user.id,
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="uniao-e-forca-meus-dados-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
