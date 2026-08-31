import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  IdCard,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { getMyKycSummary } from "@/lib/kyc/queries";
import { formatDateTimeBR } from "@/lib/utils";
import {
  CARD,
  InfoBanner,
  PageHeader,
  SectionCard,
  btnPrimary,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { BasicKycForm, EnhancedKycForm } from "./kyc-forms";

export const metadata: Metadata = { title: "Verificação de identidade" };

export default async function KycPage() {
  const s = await getMyKycSummary();
  const inReview = ["pending", "in_review"].includes(s.latestStatus ?? "");
  const rejected =
    s.latestCase?.status === "rejected" && !!s.latestCase.rejection_reason;
  const allDone = s.hasBasic && s.hasEnhanced;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Verificação de identidade"
        subtitle="Precisamos confirmar alguns dados para que você possa solicitar saques e receber valores maiores."
      />

      {/* Indicador de etapas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StepCard
          n={1}
          icon={UserRound}
          title="Dados pessoais"
          description="Confirme seu nome e data de nascimento."
          done={s.hasBasic}
          active={!s.hasBasic}
        />
        <StepCard
          n={2}
          icon={IdCard}
          title="Documento com foto"
          description="Envie um documento oficial e uma selfie."
          done={s.hasEnhanced}
          active={s.hasBasic && !s.hasEnhanced}
        />
      </div>

      {/* Estados */}
      {allDone && (
        <div className={cn(CARD, "border-[#C7ECD5] bg-[#F3FCF6] p-6")}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[#20B85A]" />
            <div>
              <h2 className="text-[17px] font-bold text-[#071D4A]">
                Identidade verificada
              </h2>
              <p className="mt-1 text-sm text-[#5B6B88]">
                Sua identidade foi confirmada. Você já pode solicitar saques.
              </p>
              <Link
                href="/painel/saques"
                className={cn(btnPrimary, "mt-4 bg-[#20B85A] hover:bg-[#1AA150]")}
              >
                Ir para saques <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {!allDone && rejected && (
        <InfoBanner tone="warning">
          <span className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#B7791F]" />
            <span>
              Não conseguimos concluir a última análise: {s.latestCase!.rejection_reason}.
              Você pode enviar os documentos novamente abaixo.
            </span>
          </span>
        </InfoBanner>
      )}

      {!allDone && inReview && !rejected && (
        <div className={cn(CARD, "p-5")}>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-[#B7791F]" />
            <div>
              <p className="font-bold text-[#071D4A]">Verificação em análise</p>
              <p className="mt-1 text-sm text-[#5B6B88]">
                Recebemos seus documentos e estamos analisando as informações
                {s.latestCase
                  ? ` (enviados em ${formatDateTimeBR(s.latestCase.submitted_at)})`
                  : ""}
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulários */}
      {!s.hasBasic && (
        <SectionCard
          title="1. Dados pessoais"
          actions={<RequiredBadge />}
        >
          <p className="mb-4 text-sm text-[#5B6B88]">
            Preencha suas informações exatamente como estão no documento.
          </p>
          <BasicKycForm />
        </SectionCard>
      )}

      {!s.hasEnhanced && (
        <SectionCard
          title="2. Documento com foto"
          actions={<RequiredBadge />}
        >
          <p className="mb-4 text-sm text-[#5B6B88]">
            Envie um documento oficial com foto e uma selfie para confirmação.
          </p>
          <EnhancedKycForm />
        </SectionCard>
      )}
    </div>
  );
}

function RequiredBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#ECF9F0] px-2.5 py-1 text-[12px] font-semibold text-[#1B8F45]">
      Obrigatório
    </span>
  );
}

function StepCard({
  n,
  icon: Icon,
  title,
  description,
  done,
  active,
}: {
  n: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        CARD,
        "flex items-start gap-3 p-4",
        active && "border-[#0645D8] ring-1 ring-[#0645D8]",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          done
            ? "bg-[#ECF9F0] text-[#20B85A]"
            : active
              ? "bg-[#0645D8] text-white"
              : "bg-[#EEF3FA] text-[#9AA8BF]",
        )}
      >
        {done ? <Check className="size-5" /> : <Icon className="size-5" />}
      </span>
      <div>
        <p
          className={cn(
            "text-[15px] font-bold",
            active || done ? "text-[#071D4A]" : "text-[#5B6B88]",
          )}
        >
          {n}. {title}
        </p>
        <p className="mt-0.5 text-[13px] text-[#5B6B88]">{description}</p>
      </div>
    </div>
  );
}
