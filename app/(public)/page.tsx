import Link from "next/link";
import {
  ShieldCheck,
  HandCoins,
  Wallet,
  HeartHandshake,
  Share2,
  Eye,
  BadgeCheck,
  ScanEye,
  Lock,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CampaignCard,
  type CampaignCardData,
} from "@/components/campaigns/campaign-card";
import { listCategories, listPublicCampaigns } from "@/lib/campaigns/queries";

export const revalidate = 300;

function pickCover(row: Record<string, unknown>): string | null {
  const m = row.campaign_media as
    | { public_url?: string }
    | { public_url?: string }[]
    | null;
  if (!m) return null;
  if (Array.isArray(m)) return m[0]?.public_url ?? null;
  return m.public_url ?? null;
}

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    listCategories().catch(() => []),
    listPublicCampaigns({ sort: "progress", pageSize: 6 }).catch(() => ({
      items: [] as Record<string, unknown>[],
    })),
  ]);

  const cards: CampaignCardData[] = (featured.items ?? []).map((row) => {
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

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b bg-brand-navy text-white">
        <picture>
          <source media="(min-width: 768px)" srcSet="/hero.jpg" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-mobile.jpg"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-brand-navy/40 md:to-brand-navy/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/85 via-brand-navy/20 to-brand-navy/40 md:to-transparent" />

        <div className="container relative py-24 md:py-32">
          <div className="max-w-xl space-y-6">
            <h1 className="text-4xl font-bold leading-tight drop-shadow-sm md:text-5xl">
              Sozinho é difícil. Junto, a gente consegue.
            </h1>
            <p className="max-w-md text-lg text-white/85">
              Crie uma campanha gratuita, receba doações por PIX e conte com
              quem quer ajudar. Para uma emergência, um tratamento, um sonho ou
              uma causa — você não precisa passar por isso sozinho.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/cadastro">Criar minha campanha</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white/15 hover:text-white"
              >
                <Link href="/campanhas">Quero ajudar</Link>
              </Button>
            </div>
            <p className="text-sm text-white/70">
              Criar é grátis · Doações por PIX · Repasse para a sua conta
            </p>
          </div>
        </div>
      </section>

      {/* Segurança / confiança */}
      <section className="border-b bg-brand-surface">
        <div className="container py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold">Você está segura aqui</h2>
            <p className="mt-2 text-muted-foreground">
              Cuidamos de cada etapa para que a sua doação chegue a quem precisa
              e para que quem arrecada receba com tranquilidade.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Trust
              icon={<BadgeCheck />}
              title="Identidade verificada"
              text="Todo mundo que arrecada passa por verificação de identidade antes de sacar."
            />
            <Trust
              icon={<Eye />}
              title="Transparência total"
              text="Cada doação e cada saque ficam registrados e disponíveis para conferência."
            />
            <Trust
              icon={<ScanEye />}
              title="Monitoramento antifraude"
              text="Acompanhamos comportamentos suspeitos e podemos segurar valores em análise."
            />
            <Trust
              icon={<Lock />}
              title="Dinheiro protegido"
              text="O saldo só é liberado para a chave PIX do responsável, depois de conferência."
            />
          </div>
        </div>
      </section>

      {/* Campanhas em destaque */}
      {cards.length > 0 && (
        <section className="container py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Campanhas acontecendo agora</h2>
              <p className="mt-2 text-muted-foreground">
                Pessoas reais pedindo ajuda neste momento. Qualquer valor faz
                diferença.
              </p>
            </div>
            <Link
              href="/campanhas"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              Ver todas <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <CampaignCard key={c.slug} c={c} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline">
              <Link href="/campanhas">Ver todas as campanhas</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="border-t bg-brand-surface">
          <div className="container py-16">
            <h2 className="text-2xl font-bold">Para qualquer causa</h2>
            <p className="mt-2 text-muted-foreground">
              Encontre uma campanha pela área que você quer apoiar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/campanhas?categoria=${cat.slug}`}
                  className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section className="container py-16">
        <h2 className="text-2xl font-bold">Como funciona</h2>
        <p className="mt-2 text-muted-foreground">
          Do primeiro clique ao dinheiro na sua conta.
        </p>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            n={1}
            title="Crie sua campanha"
            text="Cadastre-se de graça, conte a sua história, defina a meta e adicione fotos."
          />
          <Step
            n={2}
            title="Compartilhe"
            text="Divulgue o link com amigos, familiares e nas redes sociais. Quanto mais gente vê, mais ajuda chega."
          />
          <Step
            n={3}
            title="Receba por PIX"
            text="As doações entram automaticamente e você acompanha tudo em tempo real pelo painel."
          />
          <Step
            n={4}
            title="Saque quando quiser"
            text="Peça o repasse do saldo para a sua chave PIX. Sem prazo mínimo de campanha."
          />
        </div>
      </section>

      {/* Pilares */}
      <section className="border-t bg-brand-surface">
        <div className="container py-16">
          <h2 className="text-center text-2xl font-bold">
            Por que criar a sua campanha no União &amp; Força
          </h2>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<HeartHandshake />}
              title="Para qualquer causa"
              text="Saúde, emergências, animais, educação, projetos, família e muito mais."
            />
            <Feature
              icon={<HandCoins />}
              title="Doações por PIX"
              text="Quem quer ajudar paga na hora pelo QR Code. A doação entra automaticamente após a confirmação."
            />
            <Feature
              icon={<Wallet />}
              title="Acompanhe em tempo real"
              text="Veja cada doação, o total arrecadado e quanto já está disponível para saque."
            />
            <Feature
              icon={<Share2 />}
              title="Fácil de divulgar"
              text="Um link para compartilhar em qualquer lugar e uma página bonita para a sua campanha."
            />
            <Feature
              icon={<Eye />}
              title="Transparência total"
              text="Extrato completo de tudo o que entra e sai, doação por doação."
            />
            <Feature
              icon={<ShieldCheck />}
              title="Segurança de verdade"
              text="Verificação de identidade, monitoramento contra fraudes e seus dados protegidos."
            />
          </div>
        </div>
      </section>

      {/* Missão */}
      <section className="bg-brand-navy text-white">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <p className="max-w-2xl text-xl font-medium leading-relaxed md:text-2xl">
            A gente acredita que solidariedade organizada muda histórias. Por
            isso cada real doado é rastreável do começo ao fim — para chegar
            inteiro a quem precisa.
          </p>
          <p className="text-sm text-white/60">— Equipe União &amp; Força</p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-brand-surface">
        <div className="container flex flex-col items-center gap-4 py-14 text-center">
          <h2 className="text-2xl font-bold">Pronto para começar?</h2>
          <p className="max-w-md text-muted-foreground">
            Criar a campanha é grátis. Você só paga uma pequena taxa quando
            recebe uma doação.
          </p>
          <Button asChild size="lg">
            <Link href="/cadastro">Criar minha campanha</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Trust({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success [&_svg]:size-5">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Step({
  n,
  title,
  text,
}: {
  n: number;
  title: string;
  text: string;
}) {
  return (
    <div>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {n}
      </span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
          {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
