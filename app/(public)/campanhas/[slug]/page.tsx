import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  MapPin,
  Users,
  HeartHandshake,
  BadgeCheck,
  ShieldCheck,
  Eye,
} from "lucide-react";

import {
  getCampaignBySlug,
  getCampaignMedia,
  getCampaignOrganizer,
  getCampaignSupporters,
  getPublishedUpdates,
  progressPercent,
} from "@/lib/campaigns/queries";
import { createClient } from "@/lib/supabase/server";
import { toPlainText } from "@/lib/campaigns/sanitize";
import { PUBLIC_STATUSES } from "@/lib/campaigns/state-machine";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { publicEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { ProgressBar } from "@/components/campaigns/progress-bar";
import { ShareButton } from "@/components/campaigns/share-button";
import { ReportForm } from "./report-form";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await getCampaignBySlug(slug);
  if (res.kind !== "found") {
    return { title: "Campanha não encontrada", robots: { index: false } };
  }
  const c = res.campaign;
  const desc = (c.summary || toPlainText(c.story).slice(0, 155)).trim();
  const isPublic = PUBLIC_STATUSES.includes(
    c.status as (typeof PUBLIC_STATUSES)[number],
  );

  let cover: string | undefined;
  if (c.cover_media_id) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("campaign_media")
      .select("public_url")
      .eq("id", c.cover_media_id)
      .maybeSingle();
    cover = data?.public_url ?? undefined;
  }

  return {
    title: c.title,
    description: desc,
    alternates: { canonical: `/campanhas/${c.slug}` },
    robots: isPublic ? undefined : { index: false, follow: true },
    openGraph: {
      title: c.title,
      description: desc,
      type: "article",
      url: `/campanhas/${c.slug}`,
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: desc,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { slug } = await params;
  const { aba } = await searchParams;
  const res = await getCampaignBySlug(slug);

  if (res.kind === "redirect") redirect(`/campanhas/${res.to}`);
  if (res.kind === "not_found") notFound();

  const { campaign: c, category } = res;

  // Só o público pode ver ativa/concluída; rascunhos/bloqueadas caem em 404
  // para quem não é dono/staff (o dono acessa pelo painel).
  if (!PUBLIC_STATUSES.includes(c.status)) notFound();

  const [media, updates, supporters, organizer] = await Promise.all([
    getCampaignMedia(c.id),
    getPublishedUpdates(c.id),
    getCampaignSupporters(c.id, 30),
    getCampaignOrganizer(c.owner_user_id),
  ]);

  // Contador de visualizações — best-effort, não bloqueia a renderização.
  try {
    const sb = await createClient();
    await sb.rpc("increment_campaign_view", { p_slug: c.slug });
  } catch {
    /* ignora */
  }
  const cover = media.find((m) => m.id === c.cover_media_id) ?? media[0] ?? null;
  const gallery = media.filter((m) => m.id !== cover?.id);
  const pct = progressPercent(c);
  const tab =
    aba === "atualizacoes"
      ? "atualizacoes"
      : aba === "apoiadores"
        ? "apoiadores"
        : "historia";

  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: c.title,
    description: c.summary || toPlainText(c.story).slice(0, 200),
    url: `${base}/campanhas/${c.slug}`,
    inLanguage: "pt-BR",
    image: cover?.public_url ? [cover.public_url] : undefined,
    datePublished: c.published_at ?? undefined,
    dateModified: c.updated_at,
    isPartOf: { "@type": "WebSite", name: "União & Força", url: base },
    about: {
      "@type": "DonateAction",
      name: `Doar para ${c.title}`,
      recipient: { "@type": "Organization", name: "União & Força" },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campanhas", item: `${base}/campanhas` },
        { "@type": "ListItem", position: 2, name: c.title, item: `${base}/campanhas/${c.slug}` },
      ],
    },
  };

  return (
    <article className="container py-8">
      <JsonLd data={jsonLd} />
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/campanhas" className="hover:text-foreground">
          Campanhas
        </Link>
        {category && (
          <>
            {" / "}
            <Link
              href={`/campanhas?categoria=${category.slug}`}
              className="hover:text-foreground"
            >
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Coluna principal */}
        <div className="min-w-0 space-y-6">
          <h1 className="text-3xl font-bold leading-tight">{c.title}</h1>

          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
            {cover ? (
              <Image
                src={cover.public_url}
                alt={c.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-navy/10 to-success/10 text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" /> {c.supporters_count} apoiadores
            </span>
            <span className="inline-flex items-center gap-1.5">
              Por <strong className="font-medium text-foreground">{organizer.name}</strong>
              {organizer.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
                  <BadgeCheck className="size-3.5" /> Identidade verificada
                </span>
              )}
            </span>
            {(c.city || c.state) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {[c.city, c.state].filter(Boolean).join(" · ")}
              </span>
            )}
            {c.view_count > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-4" /> {c.view_count.toLocaleString("pt-BR")}{" "}
                visualizações
              </span>
            )}
          </div>

          {/* Abas */}
          <div className="border-b">
            <div className="-mb-px flex gap-6">
              <Link
                href={`/campanhas/${c.slug}`}
                className={`border-b-2 pb-3 text-sm font-medium ${
                  tab === "historia"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                História
              </Link>
              <Link
                href={`/campanhas/${c.slug}?aba=atualizacoes`}
                className={`border-b-2 pb-3 text-sm font-medium ${
                  tab === "atualizacoes"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                Atualizações ({updates.length})
              </Link>
              <Link
                href={`/campanhas/${c.slug}?aba=apoiadores`}
                className={`border-b-2 pb-3 text-sm font-medium ${
                  tab === "apoiadores"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                Apoiadores ({c.supporters_count})
              </Link>
            </div>
          </div>

          {tab === "apoiadores" ? (
            <div className="space-y-2">
              {supporters.length === 0 ? (
                <p className="text-muted-foreground">
                  Seja o primeiro a apoiar esta campanha.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {supporters.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">
                        {formatBRL(s.amount_cents)}
                        {s.paid_at ? ` · ${formatDateTimeBR(s.paid_at)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {c.supporters_count > supporters.length && (
                <p className="text-xs text-muted-foreground">
                  + {c.supporters_count - supporters.length} apoiador(es) anônimo(s)
                </p>
              )}
            </div>
          ) : tab === "historia" ? (
            <>
              {c.story ? (
                <div
                  className="rich-text"
                  dangerouslySetInnerHTML={{ __html: c.story }}
                />
              ) : (
                <p className="text-muted-foreground">
                  O criador ainda não adicionou a história completa.
                </p>
              )}

              {gallery.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((m) => (
                    <div
                      key={m.id}
                      className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                    >
                      <Image
                        src={m.public_url}
                        alt=""
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {updates.length === 0 ? (
                <p className="text-muted-foreground">
                  Ainda não há atualizações nesta campanha.
                </p>
              ) : (
                updates.map((u) => (
                  <div key={u.id} className="rounded-lg border p-4">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold">{u.title}</h3>
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {u.published_at ? formatDateTimeBR(u.published_at) : ""}
                      </time>
                    </div>
                    <div
                      className="rich-text text-sm"
                      dangerouslySetInnerHTML={{ __html: u.body }}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          <ReportForm slug={c.slug} />
        </div>

        {/* Sidebar de doação */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-4 rounded-xl border bg-card p-5">
            <div>
              <p className="text-2xl font-bold">{formatBRL(c.raised_amount_cents)}</p>
              <p className="text-sm text-muted-foreground">
                arrecadados de {formatBRL(c.goal_amount_cents)} · {pct}%
              </p>
            </div>
            <ProgressBar percent={pct} />
            <p className="text-sm text-muted-foreground">
              {c.supporters_count} {c.supporters_count === 1 ? "apoiador" : "apoiadores"}
            </p>

            {c.status === "completed" ? (
              <div className="rounded-md bg-success/10 p-3 text-sm text-foreground">
                Esta campanha foi concluída. Obrigado a quem apoiou!
              </div>
            ) : (
              <Button asChild size="lg" variant="success" className="w-full">
                <Link href={`/campanhas/${c.slug}/contribuir`}>
                  <HeartHandshake className="size-4" /> Quero ajudar
                </Link>
              </Button>
            )}

            <ShareButton
              url={`${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")}/campanhas/${c.slug}`}
              title={c.title}
            />
          </div>

          <div className="mt-4 rounded-xl border bg-card p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="size-4 text-success" /> Doação protegida
            </p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li>O pagamento é confirmado pelo provedor de PIX, nunca pelo navegador.</li>
              <li>
                {organizer.verified
                  ? "A identidade do responsável foi verificada pela nossa equipe."
                  : "O responsável passa por verificação de identidade antes de sacar."}
              </li>
              <li>Toda campanha é revisada antes de ficar pública e pode ser denunciada.</li>
            </ul>
            <Link
              href="/regras-e-seguranca"
              className="mt-2 inline-block font-medium text-primary hover:underline"
            >
              Como o dinheiro é protegido
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
