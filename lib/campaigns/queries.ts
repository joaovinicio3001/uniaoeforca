import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type CampaignMediaRow =
  Database["public"]["Tables"]["campaign_media"]["Row"];
export type CampaignUpdateRow =
  Database["public"]["Tables"]["campaign_updates"]["Row"];

const CARD_COLUMNS =
  "id, title, slug, summary, goal_amount_cents, raised_amount_cents, supporters_count, status, city, state, published_at, category_id, cover_media_id";

export function progressPercent(row: {
  raised_amount_cents: number;
  goal_amount_cents: number;
}): number {
  if (row.goal_amount_cents <= 0) return 0;
  return Math.min(
    100,
    Math.round((row.raised_amount_cents / row.goal_amount_cents) * 100),
  );
}

export async function listCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("position");
  return data ?? [];
}

export type PublicListParams = {
  q?: string;
  category?: string;
  state?: string;
  sort?: "recent" | "progress" | "goal";
  page?: number;
  pageSize?: number;
};

export async function listPublicCampaigns(params: PublicListParams) {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(48, params.pageSize ?? 12);
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("campaigns")
    .select(`${CARD_COLUMNS}, categories(name, slug), campaign_media!campaigns_cover_media_fk(public_url)`, {
      count: "exact",
    })
    .in("status", ["active", "completed"])
    .neq("visibility", "private");

  if (params.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (params.state && params.state.trim()) {
    query = query.eq("state", params.state.trim().toUpperCase());
  }

  if (params.q && params.q.trim()) {
    query = query.textSearch("search_tsv", params.q.trim(), {
      type: "websearch",
      config: "portuguese",
    });
  }

  switch (params.sort) {
    case "progress":
      query = query.order("raised_amount_cents", { ascending: false });
      break;
    case "goal":
      query = query.order("goal_amount_cents", { ascending: true });
      break;
    default:
      query = query.order("published_at", { ascending: false, nullsFirst: false });
  }

  const { data, count } = await query.range(from, from + pageSize - 1);
  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

/** Resolve slug atual ou redirect. Retorna { campaign } ou { redirectTo }. */
/**
 * `cache()` dedupa a chamada dentro do mesmo request — a página de campanha
 * usa em `generateMetadata` e no corpo, então roda 1 query em vez de 2.
 */
export const getCampaignBySlug = cache(async function getCampaignBySlug(
  slug: string,
): Promise<
  | { kind: "found"; campaign: CampaignRow; category: CategoryRow | null }
  | { kind: "redirect"; to: string }
  | { kind: "not_found" }
> {
  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (campaign) {
    let category: CategoryRow | null = null;
    if (campaign.category_id) {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("id", campaign.category_id)
        .maybeSingle();
      category = data ?? null;
    }
    return { kind: "found", campaign, category };
  }

  const { data: redirect } = await supabase
    .from("campaign_slug_redirects")
    .select("campaign_id")
    .eq("old_slug", slug)
    .maybeSingle();
  if (redirect) {
    const { data: target } = await supabase
      .from("campaigns")
      .select("slug")
      .eq("id", redirect.campaign_id)
      .maybeSingle();
    if (target) return { kind: "redirect", to: target.slug };
  }

  return { kind: "not_found" };
});

export async function getCampaignMedia(
  campaignId: string,
): Promise<CampaignMediaRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_media")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("position");
  return data ?? [];
}

export async function getPublishedUpdates(
  campaignId: string,
): Promise<CampaignUpdateRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_updates")
    .select("*")
    .eq("campaign_id", campaignId)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });
  return data ?? [];
}

/** Campanhas do usuário logado (qualquer status). */
export async function listMyCampaigns(): Promise<CampaignRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export type MyCampaignCard = CampaignRow & {
  coverUrl: string | null;
  categoryName: string | null;
  mediaCount: number;
};

/**
 * Campanhas do usuário + metadados de apresentação (capa, categoria, nº de
 * imagens) para os cards do painel. Uma consulta a mais só de leitura.
 */
export async function listMyCampaignsWithMeta(): Promise<MyCampaignCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows } = await supabase
    .from("campaigns")
    .select(
      "*, categories(name), campaign_media!campaigns_cover_media_fk(public_url)",
    )
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false });
  if (!rows?.length) return [];

  const ids = rows.map((r) => r.id);
  const { data: mediaRows } = await supabase
    .from("campaign_media")
    .select("campaign_id")
    .in("campaign_id", ids);
  const counts = new Map<string, number>();
  for (const m of mediaRows ?? []) {
    counts.set(m.campaign_id, (counts.get(m.campaign_id) ?? 0) + 1);
  }

  return rows.map((r) => {
    const { categories, campaign_media, ...campaign } = r as typeof r & {
      categories: { name: string } | null;
      campaign_media: { public_url: string } | null;
    };
    return {
      ...(campaign as CampaignRow),
      coverUrl: campaign_media?.public_url ?? null,
      categoryName: categories?.name ?? null,
      mediaCount: counts.get(r.id) ?? 0,
    };
  });
}

export type PublicSupporter = {
  name: string;
  amount_cents: number;
  paid_at: string | null;
};

/**
 * Apoiadores públicos (pagos, não anônimos). Lido server-side com service_role
 * selecionando só colunas seguras — evita expor a tabela `donations` ou uma
 * função SECURITY DEFINER na API (doc §5, §21.1).
 */
export async function getCampaignSupporters(
  campaignId: string,
  limit = 20,
): Promise<PublicSupporter[]> {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("donations")
    .select("donor_name, gross_amount_cents, paid_at")
    .eq("campaign_id", campaignId)
    .eq("status", "paid")
    .eq("anonymous", false)
    .order("paid_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  return (data ?? []).map((d) => ({
    name: d.donor_name?.trim() || "Apoiador",
    amount_cents: d.gross_amount_cents,
    paid_at: d.paid_at,
  }));
}

export async function getMyCampaign(id: string): Promise<CampaignRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export type CampaignOrganizer = {
  name: string;
  verified: boolean;
};

/**
 * Responsável pela campanha para exibição pública: primeiro nome (ou nome de
 * exibição) e se a identidade dele já foi verificada (KYC aprovado).
 */
export async function getCampaignOrganizer(
  ownerUserId: string,
): Promise<CampaignOrganizer> {
  if (!hasServiceRole()) return { name: "Responsável", verified: false };
  const admin = createAdminClient();
  const [{ data: profile }, { data: kyc }] = await Promise.all([
    admin
      .from("profiles")
      .select("display_name, full_name")
      .eq("id", ownerUserId)
      .maybeSingle(),
    admin
      .from("kyc_cases")
      .select("id")
      .eq("user_id", ownerUserId)
      .eq("status", "approved")
      .limit(1),
  ]);

  // O nome de exibição é escolhido pelo usuário e já é público — mostra
  // como está (ex.: nome de uma organização). Só o nome legal (full_name) é
  // abreviado para "Primeiro S." por privacidade.
  const display = profile?.display_name?.trim();
  let name: string;
  if (display) {
    name = display;
  } else {
    const parts = (profile?.full_name?.trim() || "Responsável")
      .split(/\s+/)
      .filter(Boolean);
    const first = parts[0] ?? "Responsável";
    const last = parts.length > 1 ? parts[parts.length - 1] : "";
    name = last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
  }

  return { name, verified: (kyc ?? []).length > 0 };
}

export type OwnerDonation = {
  id: string;
  donor: string;
  anonymous: boolean;
  message: string | null;
  gross_amount_cents: number;
  net_amount_cents: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};

/** Doações de uma campanha, para o dono (RLS: donations_select_campaign_owner). */
export async function getCampaignDonations(
  campaignId: string,
  limit = 100,
): Promise<OwnerDonation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select(
      "id, donor_name, anonymous, message, gross_amount_cents, net_amount_cents, status, created_at, paid_at",
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((d) => ({
    id: d.id,
    donor: d.anonymous
      ? "Anônimo"
      : d.donor_name?.trim() || "Apoiador",
    anonymous: d.anonymous,
    message: d.message?.trim() || null,
    gross_amount_cents: d.gross_amount_cents,
    net_amount_cents: d.net_amount_cents,
    status: d.status,
    created_at: d.created_at,
    paid_at: d.paid_at,
  }));
}
