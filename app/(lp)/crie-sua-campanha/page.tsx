import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  HeartHandshake,
  LineChart,
  Share2,
  Wallet,
  Lock,
  BadgeCheck,
  ScrollText,
  Check,
} from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listPublicCampaigns } from "@/lib/campaigns/queries";
import { ATTRIBUTION_PARAMS, type Attribution } from "@/lib/attribution";
import {
  CampaignCard,
  type CampaignCardData,
} from "@/components/campaigns/campaign-card";
import { Accordion } from "@/components/ui/accordion";
import { ProgressBar } from "@/components/campaigns/progress-bar";
import { LpHeader } from "@/components/lp/lp-header";
import { LpCta } from "@/components/lp/lp-cta";
import { LpTrack } from "@/components/lp/lp-track";
import { LpMobileCta } from "@/components/lp/lp-mobile-cta";

const CREATE_DEST = "/painel/campanhas/nova";
/** Nº mínimo de campanhas públicas para exibir a vitrine "Histórias". */
const MIN_SHOWCASE = 3;

export const metadata: Metadata = {
  title: "Crie sua campanha online | União & Força",
  description:
    "Conte sua história, compartilhe sua campanha e mobilize pessoas para apoiar sua causa na União & Força.",
  alternates: { canonical: "/crie-sua-campanha" },
  // Página de tráfego pago — não deve competir com a home nos resultados de busca.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Crie sua campanha online | União & Força",
    description:
      "Conte sua história, compartilhe sua campanha e mobilize pessoas para apoiar sua causa.",
    url: "/crie-sua-campanha",
    type: "website",
    images: [
      { url: "/logo-lockup.png", width: 1716, height: 829, alt: "União & Força" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crie sua campanha online | União & Força",
    images: ["/logo-lockup.png"],
  },
};

function withParams(base: string, attr: Attribution): string {
  const entries = Object.entries(attr).filter(([, v]) => !!v);
  if (entries.length === 0) return base;
  const sp = new URLSearchParams(entries as [string, string][]);
  return `${base}${base.includes("?") ? "&" : "?"}${sp.toString()}`;
}

type SP = Record<string, string | string[] | undefined>;

export default async function CrieSuaCampanhaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const attr: Attribution = {};
  for (const key of ATTRIBUTION_PARAMS) {
    const v = sp[key];
    if (typeof v === "string" && v) attr[key] = v.slice(0, 200);
  }

  const user = await getSessionUser();
  const authed = !!user && user.profileStatus !== "blocked";

  const ctaBase = authed
    ? CREATE_DEST
    : `/cadastro?redirect=${encodeURIComponent(CREATE_DEST)}`;
  const primaryCta = withParams(ctaBase, attr);
  const loginHref = withParams(
    `/login?redirect=${encodeURIComponent(CREATE_DEST)}`,
    attr,
  );
  const ctaLabel = "Criar minha campanha";

  // ---- vitrine de campanhas reais (mesma fonte da página pública) ----
  let showcase: CampaignCardData[] = [];
  try {
    const { items } = await listPublicCampaigns({ sort: "recent", pageSize: 6 });
    showcase = (items ?? [])
      .map((row): CampaignCardData => {
        const media = (row as { campaign_media?: unknown }).campaign_media;
        const cover = Array.isArray(media)
          ? (media[0] as { public_url?: string } | undefined)?.public_url
          : (media as { public_url?: string } | null)?.public_url;
        const cat = (row as { categories?: { name?: string } | null }).categories;
        return {
          slug: row.slug,
          title: row.title,
          summary: row.summary ?? "",
          city: row.city,
          state: row.state,
          goal_amount_cents: row.goal_amount_cents,
          raised_amount_cents: row.raised_amount_cents,
          supporters_count: row.supporters_count ?? 0,
          status: row.status,
          categoryName: cat?.name ?? null,
          coverUrl: cover ?? null,
        };
      })
      .slice(0, 3);
  } catch {
    showcase = [];
  }
  const hasShowcase = showcase.length >= MIN_SHOWCASE;

  // ---- taxa real da plataforma para o FAQ ----
  let platformPct = "5";
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { data: rule } = await supabase
      .from("fee_rules")
      .select("percentage_bps")
      .lte("active_from", now)
      .or(`active_to.is.null,active_to.gt.${now}`)
      .order("active_from", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rule) {
      platformPct = (rule.percentage_bps / 100).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      });
    }
  } catch {
    /* usa o padrão */
  }

  const benefits = [
    {
      icon: Zap,
      title: "Criação rápida e simples",
      body: "Em poucos minutos você estrutura sua campanha e conta a sua história.",
    },
    {
      icon: HeartHandshake,
      title: "Doações via PIX",
      body: "Uma forma prática e imediata para os apoiadores contribuírem.",
    },
    {
      icon: LineChart,
      title: "Acompanhamento pelo painel",
      body: "Veja doações, valores e apoiadores da sua campanha em um só lugar.",
    },
    {
      icon: Share2,
      title: "Compartilhamento fácil",
      body: "Divulgue sua campanha no WhatsApp, Instagram, Facebook e outros canais.",
    },
    {
      icon: Wallet,
      title: "Gestão dos valores",
      body: "Acompanhe o saldo disponível e solicite a retirada por PIX pelo painel.",
    },
    {
      icon: BadgeCheck,
      title: "Verificação e confiança",
      body: "A verificação de identidade ajuda a tornar o ambiente mais transparente.",
    },
  ];

  const steps = [
    {
      n: "01",
      title: "Crie sua campanha",
      body: "Conte sua história, escolha a meta e publique. A revisão é rápida.",
    },
    {
      n: "02",
      title: "Compartilhe",
      body: "Envie o link para amigos, familiares e compartilhe nas suas redes.",
    },
    {
      n: "03",
      title: "Receba apoio",
      body: "Acompanhe as contribuições e a evolução da campanha pelo painel.",
    },
  ];

  const faq = [
    {
      title: "Como crio uma campanha?",
      content: (
        <p>
          Você cria uma conta, conta a sua história, define uma meta e publica. A
          campanha passa por uma revisão rápida antes de ficar no ar. Todo o
          processo é feito online, pelo navegador.
        </p>
      ),
    },
    {
      title: "Preciso pagar para criar uma campanha?",
      content: (
        <p>
          Não. Criar, editar e divulgar uma campanha é gratuito. Só há custo
          quando entra ou sai dinheiro: uma taxa de {platformPct}% sobre cada
          doação confirmada e o custo do PIX no recebimento e no saque, repassado
          sem margem. O detalhamento fica em{" "}
          <Link href="/regras-e-seguranca" className="text-[#0645D8] underline">
            Regras e segurança
          </Link>
          .
        </p>
      ),
    },
    {
      title: "Como as pessoas contribuem?",
      content: (
        <p>
          Pelo PIX. O apoiador escolhe o valor, gera um QR Code ou o código
          copia e cola e paga. A confirmação é automática e a doação aparece na
          campanha em seguida.
        </p>
      ),
    },
    {
      title: "Como acompanho a arrecadação?",
      content: (
        <p>
          Pelo seu painel. Lá você vê o total arrecadado, a lista de doações, os
          apoiadores e pode publicar atualizações para quem está acompanhando.
        </p>
      ),
    },
    {
      title: "Como funciona a retirada dos valores?",
      content: (
        <p>
          Você solicita o saque pelo painel para uma chave PIX que seja o CPF do
          titular da conta. Antes do primeiro saque, pedimos a verificação de
          identidade (documento com foto e selfie). O repasse costuma cair em até
          24 horas após a aprovação.
        </p>
      ),
    },
    {
      title: "Posso compartilhar minha campanha nas redes sociais?",
      content: (
        <p>
          Sim. Cada campanha tem um link próprio e botões de compartilhamento
          para WhatsApp, Facebook, X e Telegram, além de copiar o link.
        </p>
      ),
    },
    {
      title: "Como funciona a verificação?",
      content: (
        <p>
          Quem arrecada envia uma foto do documento e uma selfie antes do
          primeiro saque. Os documentos ficam guardados em local privado, com
          acesso restrito à equipe, e são usados apenas para essa conferência.
        </p>
      ),
    },
  ];

  return (
    <>
      <LpTrack />
      <LpHeader
        ctaHref={primaryCta}
        ctaLabel={ctaLabel}
        loginHref={loginHref}
      />

      <main className="pb-24 md:pb-0">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-16">
          <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <h1 className="text-[27px] font-bold leading-[1.15] tracking-tight text-[#071D4A] sm:text-[38px] sm:leading-[1.12] lg:text-[44px]">
                Transforme sua história em esperança.{" "}
                <span className="text-[#0645D8]">
                  Crie sua campanha e receba apoio de verdade.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#5B6B88] sm:text-[17px]">
                Na União &amp; Força, você conta a sua história, compartilha a
                sua necessidade e mobiliza pessoas que querem ajudar.
              </p>

              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#3C4B66]">
                {[
                  "Criação online",
                  "Doações via PIX",
                  "Acompanhamento pelo painel",
                ].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-[#20B85A]" />
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <LpCta href={primaryCta} location="hero" size="lg">
                  {ctaLabel}
                </LpCta>
                <p className="mt-2.5 text-[13px] text-[#5B6B88]">
                  Comece gratuitamente e conte a sua história.
                </p>
              </div>
            </div>

            {/* Imagem + card ilustrativo */}
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#EAF1FF]">
                <Image
                  src="/hero.jpg"
                  alt="Pessoas se apoiando em um momento difícil"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 460px"
                  className="object-cover"
                />
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-2xl border border-[#E6EDF8] bg-white p-4 shadow-[0_18px_40px_rgba(20,50,100,0.14)] sm:-bottom-6 sm:left-auto sm:right-6 sm:w-[280px]">
                <span className="inline-flex rounded-full bg-[#EDF4FF] px-2 py-0.5 text-[11px] font-semibold text-[#0645D8]">
                  Exemplo
                </span>
                <p className="mt-2 text-sm font-semibold text-[#071D4A]">
                  O título da sua campanha
                </p>
                <div className="mt-2">
                  <ProgressBar percent={18} />
                </div>
                <p className="mt-2 text-[12px] text-[#5B6B88]">
                  Assim a sua campanha aparece para quem você compartilhar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* VALOR / CONFIANÇA (sem números inventados) */}
        <section className="border-y border-[#EEF2F8] bg-[#F7FAFE]">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6">
            {[
              {
                icon: Zap,
                t: "Criação simples",
                d: "Sua campanha no ar em poucos minutos.",
              },
              {
                icon: HeartHandshake,
                t: "Doações via PIX",
                d: "O apoiador contribui em segundos.",
              },
              {
                icon: LineChart,
                t: "Tudo no painel",
                d: "Acompanhe doações e saques em um lugar.",
              },
            ].map((x) => (
              <div key={x.t} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0645D8] shadow-[0_4px_14px_rgba(20,50,100,0.06)]">
                  <x.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#071D4A]">{x.t}</p>
                  <p className="text-[13px] text-[#5B6B88]">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[26px] font-bold text-[#071D4A] sm:text-[32px]">
              Conte sua história e encontre apoio
            </h2>
            <p className="mt-2 text-[15px] text-[#5B6B88]">
              A União &amp; Força foi feita para ajudar você a chegar mais longe.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-[#E7EDF6] bg-white p-5 transition-shadow hover:shadow-[0_12px_30px_rgba(20,50,100,0.08)]"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#EDF4FF] text-[#0645D8]">
                  <b.icon className="size-5" />
                </span>
                <h3 className="mt-3.5 font-semibold text-[#071D4A]">
                  {b.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[#5B6B88]">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3 PASSOS */}
        <section
          id="como-funciona"
          className="scroll-mt-20 border-y border-[#EEF2F8] bg-[#F7FAFE]"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[26px] font-bold text-[#071D4A] sm:text-[32px]">
                Crie sua campanha em 3 passos
              </h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((s, i) => (
                <li
                  key={s.n}
                  className="relative rounded-2xl border border-[#E7EDF6] bg-white p-6"
                >
                  <span className="text-sm font-bold text-[#0645D8]">
                    {s.n}
                  </span>
                  <h3 className="mt-2 font-semibold text-[#071D4A]">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#5B6B88]">
                    {s.body}
                  </p>
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute -right-3 top-1/2 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border border-[#E7EDF6] bg-white text-[#94A6C4] md:flex"
                    >
                      ›
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-9 text-center">
              <LpCta href={primaryCta} location="steps" size="lg">
                {ctaLabel}
              </LpCta>
            </div>
          </div>
        </section>

        {/* HISTÓRIAS / VITRINE */}
        <section id="historias" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[26px] font-bold text-[#071D4A] sm:text-[32px]">
                {hasShowcase ? "Histórias que inspiram" : "Como sua campanha aparece"}
              </h2>
              <p className="mt-2 text-[15px] text-[#5B6B88]">
                {hasShowcase
                  ? "Campanhas publicadas na União & Força."
                  : "Uma campanha bem contada, com foto, meta e progresso, pronta para compartilhar."}
              </p>
            </div>

            {hasShowcase ? (
              <>
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {showcase.map((c) => (
                    <CampaignCard key={c.slug} c={c} />
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link
                    href="/campanhas"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0645D8] hover:underline"
                  >
                    Ver todas as campanhas
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-10 grid items-center gap-8 rounded-2xl border border-[#E7EDF6] bg-[#F7FAFE] p-6 sm:grid-cols-2 sm:p-8">
                <ul className="space-y-3 text-sm text-[#3C4B66]">
                  {[
                    "Foto de capa e história completa",
                    "Meta e barra de progresso",
                    "Botões de compartilhamento nas redes",
                    "Doações por PIX com confirmação automática",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#20B85A]" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="text-center sm:text-left">
                  <LpCta href={primaryCta} location="historias" size="lg">
                    {ctaLabel}
                  </LpCta>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SEGURANÇA */}
        <section
          id="seguranca"
          className="scroll-mt-20 border-y border-[#EEF2F8] bg-[#F7FAFE]"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[26px] font-bold text-[#071D4A] sm:text-[32px]">
                Segurança para apoiar com confiança
              </h2>
              <p className="mt-2 text-[15px] text-[#5B6B88]">
                O apoio chega a quem realmente precisa.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Lock,
                  t: "Dados protegidos",
                  d: "Conexão criptografada e informações sensíveis cifradas.",
                },
                {
                  icon: BadgeCheck,
                  t: "Verificação de identidade",
                  d: "Quem arrecada passa por verificação antes do primeiro saque.",
                },
                {
                  icon: HeartHandshake,
                  t: "Pagamento confirmado",
                  d: "A doação só entra depois da confirmação pelo provedor de PIX.",
                },
                {
                  icon: ScrollText,
                  t: "Histórico registrado",
                  d: "Cada movimentação financeira fica registrada e auditável.",
                },
              ].map((x) => (
                <div
                  key={x.t}
                  className="rounded-2xl border border-[#E7EDF6] bg-white p-5"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#ECF9F0] text-[#20B85A]">
                    <x.icon className="size-5" />
                  </span>
                  <h3 className="mt-3 text-[15px] font-semibold text-[#071D4A]">
                    {x.t}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#5B6B88]">
                    {x.d}
                  </p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-xl text-center text-[13px] text-[#5B6B88]">
              Saiba mais em{" "}
              <Link
                href="/regras-e-seguranca"
                className="text-[#0645D8] underline"
              >
                Regras e segurança
              </Link>
              .
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="scroll-mt-20">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
            <h2 className="text-center text-[26px] font-bold text-[#071D4A] sm:text-[32px]">
              Dúvidas frequentes
            </h2>
            <div className="mt-8">
              <Accordion items={faq} />
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-[#071D4A]">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-[26px] font-bold text-white sm:text-[32px]">
              Dê o primeiro passo para transformar sua história
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-white/75">
              Crie sua campanha e comece a mobilizar pessoas que querem ajudar.
            </p>
            <div className="mt-7 flex justify-center">
              <LpCta href={primaryCta} location="final" size="lg" variant="white">
                {ctaLabel}
              </LpCta>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER enxuto */}
      <footer className="border-t border-[#EEF2F8] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <Image
            src="/logo-lockup.png"
            alt="União &amp; Força"
            width={1716}
            height={829}
            className="h-7 w-auto"
          />
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[#5B6B88]">
            <Link href="/termos" className="hover:text-[#071D4A]">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-[#071D4A]">
              Política de Privacidade
            </Link>
            <Link href="/ajuda" className="hover:text-[#071D4A]">
              Central de Ajuda
            </Link>
            <Link href={loginHref} className="hover:text-[#071D4A]">
              Entrar
            </Link>
          </nav>
        </div>
        <p className="pb-6 text-center text-xs text-[#94A6C4]">
          © {new Date().getFullYear()} União &amp; Força
        </p>
      </footer>

      <LpMobileCta ctaHref={primaryCta} ctaLabel={ctaLabel} />
    </>
  );
}
