import type { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/campanhas",
    "/como-funciona",
    "/como-doar",
    "/regras-e-seguranca",
    "/ajuda",
    "/termos",
    "/privacidade",
  ].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.6 }));

  let campaignRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("campaigns")
      .select("slug, updated_at")
      .in("status", ["active", "completed"])
      .neq("visibility", "private")
      .order("published_at", { ascending: false })
      .limit(5000);
    campaignRoutes = (data ?? []).map((c) => ({
      url: `${base}/campanhas/${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    // sitemap não deve derrubar o build se o banco estiver indisponível
  }

  return [...staticRoutes, ...campaignRoutes];
}
