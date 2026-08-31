import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listMyPixKeys } from "@/lib/withdrawals/queries";
import { getMyWalletBalance } from "@/lib/ledger/queries";
import { getMyKycSummary } from "@/lib/kyc/queries";
import {
  CARD,
  InfoBanner,
  SectionCard,
  btnPrimary,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { WithdrawalForm } from "./withdrawal-form";

export const metadata: Metadata = { title: "Solicitar saque" };

export default async function NovoSaquePage() {
  await requireUser("/painel/saques/nova");

  const [keys, balance, kyc] = await Promise.all([
    listMyPixKeys(),
    getMyWalletBalance(),
    getMyKycSummary(),
  ]);
  const verifiedKeys = keys.filter((k) => k.status === "verified");

  if (balance.available_cents <= 0) redirect("/painel/saques");

  const supabase = await createClient();
  const { data: rule } = await supabase
    .from("fee_rules")
    .select("withdrawal_fee_cents")
    .lte("active_from", new Date().toISOString())
    .or(`active_to.is.null,active_to.gt.${new Date().toISOString()}`)
    .order("active_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  const feeCents = rule?.withdrawal_fee_cents ?? 0;

  const needsIdentity = !kyc.hasBasic || !kyc.hasEnhanced;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/painel/saques"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6B88] transition-colors hover:text-[#0645D8]"
      >
        <ArrowLeft className="size-4" /> Voltar para saques
      </Link>

      <div>
        <h1 className="text-[26px] font-bold text-[#071D4A] sm:text-[30px]">
          Solicitar saque
        </h1>
        <p className="mt-1 text-[15px] text-[#5B6B88]">
          O valor sai do saldo disponível e vai para análise.
        </p>
      </div>

      {needsIdentity ? (
        <BlockedCard
          icon={ShieldCheck}
          title="Verificação de identidade pendente"
          description="Para solicitar um saque, precisamos confirmar sua identidade. Isso ajuda a manter sua conta e seus valores protegidos."
          banner="Enquanto a verificação não for concluída, você não poderá solicitar saques."
          bullets={[
            "É rápido e seguro",
            "Seus dados são protegidos e usados apenas para a verificação.",
          ]}
          ctaLabel="Fazer verificação"
          ctaHref="/painel/kyc"
          secondaryLabel="Saiba mais sobre a verificação"
          secondaryHref="/ajuda"
        />
      ) : verifiedKeys.length === 0 ? (
        <BlockedCard
          icon={KeyRound}
          title="Cadastre uma chave PIX"
          description="Você precisa de uma chave PIX cadastrada para receber o valor do saque."
          ctaLabel="Cadastrar chave PIX"
          ctaHref="/painel/saques/chaves"
        />
      ) : (
        <SectionCard title="Dados do saque">
          <WithdrawalForm
            keys={verifiedKeys.map((k) => ({
              id: k.id,
              type: k.type,
              masked: k.value_masked,
            }))}
            availableCents={balance.available_cents}
            feeCents={feeCents}
          />
        </SectionCard>
      )}
    </div>
  );
}

function BlockedCard({
  icon: Icon,
  title,
  description,
  banner,
  bullets,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  banner?: string;
  bullets?: string[];
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <div className={cn(CARD, "p-6 sm:p-7")}>
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#FFF8DF] text-[#B7791F]">
          <Icon className="size-7" />
        </span>
        <h2 className="mt-4 text-[18px] font-bold text-[#071D4A]">{title}</h2>
        <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-[#5B6B88]">
          {description}
        </p>
      </div>

      {banner && (
        <div className="mt-5">
          <InfoBanner tone="warning">{banner}</InfoBanner>
        </div>
      )}

      {bullets && bullets.length > 0 && (
        <ul className="mt-5 space-y-2 text-[13px] text-[#5B6B88]">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#20B85A]" />
              {b}
            </li>
          ))}
        </ul>
      )}

      <Link href={ctaHref} className={cn(btnPrimary, "mt-6 w-full")}>
        {ctaLabel}
      </Link>
      {secondaryLabel && secondaryHref && (
        <p className="mt-3 text-center">
          <Link
            href={secondaryHref}
            className="text-[13px] font-medium text-[#0645D8] hover:underline"
          >
            {secondaryLabel}
          </Link>
        </p>
      )}
    </div>
  );
}
