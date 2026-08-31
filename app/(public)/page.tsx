import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  FileCheck,
  ShieldCheck,
  ScanSearch,
  HeartHandshake,
  QrCode,
  Wallet,
  Share2,
  Eye,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CampaignCard,
  type CampaignCardData,
} from "@/components/campaigns/campaign-card";
import { CampaignSearchBar } from "@/components/campaigns/search-bar";
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

  // Grade se adapta à quantidade de campanhas — sem espaço vazio.
  const gridClass =
    cards.length >= 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : cards.length === 2
        ? "mx-auto max-w-3xl sm:grid-cols-2"
        : "mx-auto max-w-sm";

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-brand-navy text-white">
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
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/95 via-brand-navy/70 to-brand-navy/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/75 to-transparent md:from-brand-navy/30" />

        <div className="container relative flex min-h-[520px] items-center py-16 md:min-h-[480px] md:py-24">
          <div className="max-w-[620px]">
            <h1 className="text-[34px] font-bold leading-[1.06] drop-shadow-sm sm:text-5xl lg:text-[54px]">
              Juntos, todo desafio pode se transformar{" "}
              <span className="text-[#FFD500]">em esperança.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-base leading-relaxed text-white/90 sm:text-lg">
              Quando a vida surpreende ou um sonho precisa de apoio para
              acontecer, a União &amp; Força conecta você a pessoas dispostas a
              fazer a diferença.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 w-full bg-[#FFD500] font-semibold text-[#071D4A] hover:bg-[#ECC400] sm:w-auto"
              >
                <Link href="/cadastro">Criar minha campanha</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full border-white/45 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white sm:w-auto"
              >
                <Link href="/campanhas">Quero ajudar</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* BUSCA (sobreposta) */}
      <div className="relative z-10 bg-[#F7FAFE]">
        <div className="container -mt-10 pb-2 sm:-mt-12">
          <CampaignSearchBar
            categories={categories}
            className="border-[#E1E8F2] shadow-[0_12px_35px_rgba(20,50,90,0.1)]"
          />
        </div>
      </div>

      {/* SUA SEGURANÇA VEM PRIMEIRO */}
      <section className="bg-[#F7FAFE] py-14 sm:py-20">
        <div className="container">
          <SectionHead
            title={
              <>
                Sua <span className="text-primary">segurança</span> vem primeiro
              </>
            }
            subtitle="Cuidamos de cada etapa para que a sua doação chegue a quem precisa e para que quem arrecada receba com tranquilidade."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            <SecurityCard
              img="/trust/identidade.jpg"
              icon={<BadgeCheck />}
              tone="green"
              title="Identidade verificada"
              text="Todo mundo que arrecada passa por verificação de identidade antes de sacar."
            />
            <SecurityCard
              img="/trust/transparencia.jpg"
              icon={<FileCheck />}
              tone="blue"
              title="Transparência total"
              text="Cada doação e cada saque ficam registrados e disponíveis para conferência."
            />
            <SecurityCard
              img="/trust/liberacao.jpg"
              icon={<ShieldCheck />}
              tone="blue"
              title="Liberação segura"
              text="O valor é liberado via PIX diretamente para quem arrecada, após todas as verificações."
            />
            <SecurityCard
              img="/trust/monitoramento.jpg"
              icon={<ScanSearch />}
              tone="purple"
              title="Monitoramento ativo"
              text="Acompanhamos comportamentos suspeitos 24h por dia para prevenir fraudes e proteger todos os envolvidos."
            />
          </div>
        </div>
      </section>

      {/* CAMPANHAS ACONTECENDO AGORA */}
      <section className="bg-white py-14 sm:py-20">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Campanhas acontecendo agora
              </h2>
              <p className="mt-2 text-muted-foreground">
                Pessoas reais pedindo ajuda neste momento. Qualquer valor faz
                diferença.
              </p>
            </div>
            <Link
              href="/campanhas"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Ver todas <ArrowRight className="size-4" />
            </Link>
          </div>

          {cards.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#E2E9F3] bg-[#F7FAFE] p-10 text-center text-muted-foreground">
              Ainda não há campanhas ativas.{" "}
              <Link
                href="/cadastro"
                className="font-medium text-primary hover:underline"
              >
                Seja a primeira pessoa a criar uma.
              </Link>
            </div>
          ) : (
            <div className={cn("mt-8 grid gap-5", gridClass)}>
              {cards.map((c) => (
                <CampaignCard key={c.slug} c={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PARA QUALQUER CAUSA */}
      {categories.length > 0 && (
        <section className="bg-[#F7FAFE] py-14 sm:py-20">
          <div className="container">
            <SectionHead
              title="Para qualquer causa"
              subtitle="Encontre uma campanha pela área que você quer apoiar."
            />
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/campanhas?categoria=${cat.slug}`}
                  className="rounded-full border border-[#DFE7F1] bg-white px-4 py-2 text-sm font-medium text-[#344765] transition-colors hover:border-primary hover:bg-[#EAF2FF] hover:text-primary"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COMO FUNCIONA */}
      <section className="bg-white py-14 sm:py-20">
        <div className="container">
          <SectionHead
            title="Como funciona"
            subtitle="Do primeiro clique ao dinheiro na sua conta."
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StepCard
              n={1}
              img="/how/criar.png"
              title="Crie sua campanha"
              text="Cadastre-se de graça, conte a sua história, defina a meta e adicione fotos."
            />
            <StepCard
              n={2}
              img="/how/compartilhe.png"
              title="Compartilhe"
              text="Divulgue o link com amigos, familiares e nas redes sociais. Quanto mais gente vê, mais ajuda chega."
            />
            <StepCard
              n={3}
              img="/how/receba.png"
              title="Receba por PIX"
              text="As doações entram automaticamente e você acompanha tudo em tempo real pelo painel."
            />
            <StepCard
              n={4}
              img="/how/saque.png"
              title="Saque quando quiser"
              text="Peça o repasse do saldo para a sua chave PIX. Sem prazo mínimo de campanha."
            />
          </div>
        </div>
      </section>

      {/* POR QUE CRIAR NO UNIÃO & FORÇA */}
      <section className="bg-[#F7FAFE] py-14 sm:py-20">
        <div className="container">
          <SectionHead title="Por que criar a sua campanha no União & Força" />
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            <BenefitCard
              icon={<HeartHandshake />}
              tone="blue"
              title="Para qualquer causa"
              text="Saúde, emergências, animais, educação, projetos, família e muito mais."
            />
            <BenefitCard
              icon={<QrCode />}
              tone="green"
              title="Doações por PIX"
              text="Quem quer ajudar paga na hora pelo QR Code. A doação entra automaticamente após a confirmação."
            />
            <BenefitCard
              icon={<Wallet />}
              tone="cyan"
              title="Acompanhe em tempo real"
              text="Veja cada doação, o total arrecadado e quanto já está disponível para saque."
            />
            <BenefitCard
              icon={<Share2 />}
              tone="purple"
              title="Fácil de divulgar"
              text="Um link para compartilhar em qualquer lugar e uma página bonita para a sua campanha."
            />
            <BenefitCard
              icon={<Eye />}
              tone="yellow"
              title="Transparência total"
              text="Extrato completo de tudo o que entra e sai, doação por doação."
            />
            <BenefitCard
              icon={<ShieldCheck />}
              tone="purple"
              title="Segurança de verdade"
              text="Verificação de identidade, monitoramento contra fraudes e seus dados protegidos."
            />
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="bg-white py-14 sm:py-20">
        <div className="container">
          <div className="overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#063B63,#064985)] p-8 text-white sm:p-12">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-10">
              <div className="min-w-0 flex-1">
                <span
                  aria-hidden
                  className="block font-serif text-5xl leading-none text-[#23B64B]"
                >
                  &ldquo;
                </span>
                <p className="-mt-2 text-lg font-semibold leading-relaxed sm:text-xl">
                  A gente acredita que solidariedade organizada muda histórias.
                  Por isso cada real doado é rastreável do começo ao fim — para
                  chegar inteiro a quem precisa.
                </p>
                <p className="mt-3 text-sm text-white/70">
                  — Equipe União &amp; Força
                </p>
              </div>
              <Image
                src="/logo-mark.png"
                alt=""
                width={140}
                height={140}
                className="hidden size-24 shrink-0 object-contain lg:block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden bg-[#F7FAFE] py-16 sm:py-20">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[10%] top-12 size-2.5 rounded-full bg-primary/25"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-[12%] top-16 size-2 rounded-full bg-[#23B64B]/40"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-14 left-[18%] size-1.5 rounded-full bg-[#FFB800]/60"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-[20%] size-2 rounded-full bg-primary/20"
        />

        <div className="container relative flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Pronto para começar?
          </h2>
          <p className="max-w-md text-muted-foreground">
            Criar a campanha é grátis. Você só paga uma pequena taxa quando
            recebe uma doação.
          </p>
          <Button asChild size="lg" className="mt-2 h-12">
            <Link href="/cadastro">
              Criar minha campanha <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function SectionHead({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

const TONE = {
  blue: { bg: "bg-[#EAF2FF]", fg: "text-primary" },
  green: { bg: "bg-[#EAF9EF]", fg: "text-[#23B64B]" },
  cyan: { bg: "bg-[#E6F6FD]", fg: "text-[#0C86B8]" },
  purple: { bg: "bg-[#F3EAFE]", fg: "text-[#9747FF]" },
  yellow: { bg: "bg-[#FFF6DA]", fg: "text-[#E09600]" },
} as const;

function SecurityCard({
  img,
  icon,
  tone,
  title,
  text,
}: {
  img: string;
  icon: React.ReactNode;
  tone: keyof typeof TONE;
  title: string;
  text: string;
}) {
  const t = TONE[tone];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E9F3] bg-white p-3 shadow-[0_8px_25px_rgba(20,50,100,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(20,50,100,0.09)] sm:p-4">
      <div className="flex items-start gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image
            src={img}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
            t.bg,
            t.fg,
          )}
        >
          {icon}
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function StepCard({
  n,
  img,
  title,
  text,
}: {
  n: number;
  img: string;
  title: string;
  text: string;
}) {
  return (
    <div className="relative rounded-2xl border border-[#E2E9F3] bg-white p-6 pt-8 text-center shadow-[0_8px_25px_rgba(20,50,100,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(20,50,100,0.09)]">
      <span className="absolute -top-4 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-[0_6px_14px_rgba(6,69,216,0.3)]">
        {n}
      </span>
      <div className="relative mx-auto size-20">
        <Image src={img} alt="" fill sizes="80px" className="object-contain" />
      </div>
      <h3 className="mt-3 font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function BenefitCard({
  icon,
  tone,
  title,
  text,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONE;
  title: string;
  text: string;
}) {
  const t = TONE[tone];
  return (
    <div className="flex gap-4 rounded-2xl border border-[#E2E9F3] bg-white p-[22px] shadow-[0_8px_25px_rgba(20,50,100,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(20,50,100,0.09)]">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full [&_svg]:size-5",
          t.bg,
          t.fg,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
