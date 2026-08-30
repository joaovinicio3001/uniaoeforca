import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { listCategories, listPublicCampaigns } from "@/lib/campaigns/queries";
import { CampaignCard, type CampaignCardData } from "@/components/campaigns/campaign-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Campanhas",
  description:
    "Explore campanhas de arrecadação ativas na União & Força e apoie uma causa.",
};

type SP = {
  q?: string;
  categoria?: string;
  estado?: string;
  ordem?: "recent" | "progress" | "goal";
  pagina?: string;
};

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

function pickCover(row: Record<string, unknown>): string | null {
  const m = row.campaign_media as { public_url?: string } | { public_url?: string }[] | null;
  if (!m) return null;
  if (Array.isArray(m)) return m[0]?.public_url ?? null;
  return m.public_url ?? null;
}

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const [categories, result] = await Promise.all([
    listCategories(),
    listPublicCampaigns({
      q: sp.q,
      category: sp.categoria,
      state: sp.estado,
      sort: sp.ordem ?? "recent",
      page: Number(sp.pagina) || 1,
    }),
  ]);

  const cards: CampaignCardData[] = result.items.map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const cat = r.categories as { name?: string } | null;
    return {
      slug: String(r.slug),
      title: String(r.title),
      summary: String(r.summary),
      city: (r.city as string | null) ?? null,
      state: (r.state as string | null) ?? null,
      goal_amount_cents: Number(r.goal_amount_cents),
      raised_amount_cents: Number(r.raised_amount_cents),
      supporters_count: Number(r.supporters_count),
      status: String(r.status),
      categoryName: cat?.name ?? null,
      coverUrl: pickCover(r),
    };
  });

  const buildHref = (patch: Partial<SP>) => {
    const next = new URLSearchParams();
    const merged = { ...sp, ...patch };
    if (merged.q) next.set("q", merged.q);
    if (merged.categoria) next.set("categoria", merged.categoria);
    if (merged.estado) next.set("estado", merged.estado);
    if (merged.ordem && merged.ordem !== "recent") next.set("ordem", merged.ordem);
    if (merged.pagina && merged.pagina !== "1") next.set("pagina", merged.pagina);
    const qs = next.toString();
    return qs ? `/campanhas?${qs}` : "/campanhas";
  };

  return (
    <div className="container py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold">Campanhas</h1>
        <p className="mt-2 text-muted-foreground">
          {result.total} {result.total === 1 ? "campanha ativa" : "campanhas ativas"}.
          Encontre uma causa e faça parte.
        </p>
      </header>

      <form action="/campanhas" className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar por título ou descrição"
            className="pl-9"
          />
        </div>
        {sp.categoria && <input type="hidden" name="categoria" value={sp.categoria} />}
        <select
          name="estado"
          defaultValue={sp.estado ?? ""}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Todo o Brasil</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        <select
          name="ordem"
          defaultValue={sp.ordem ?? "recent"}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="recent">Mais recentes</option>
          <option value="progress">Mais arrecadaram</option>
          <option value="goal">Menor meta</option>
        </select>
        <Button type="submit">Buscar</Button>
      </form>

      <nav className="mb-8 flex flex-wrap gap-2">
        <Link
          href={buildHref({ categoria: undefined, pagina: "1" })}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm",
            !sp.categoria ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary",
          )}
        >
          Todas
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildHref({ categoria: c.slug, pagina: "1" })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              sp.categoria === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-secondary",
            )}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Nenhuma campanha encontrada com esses filtros.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <CampaignCard key={c.slug} c={c} />
          ))}
        </div>
      )}

      {result.pageCount > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildHref({ pagina: String(n) })}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm",
                n === result.page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-secondary",
              )}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
