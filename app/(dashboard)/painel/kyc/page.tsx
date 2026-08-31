import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  IdCard,
  ShieldAlert,
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
import { DocumentVerification } from "./kyc-forms";

export const metadata: Metadata = { title: "Verificação de identidade" };

export default async function KycPage() {
  const s = await getMyKycSummary();
  const inReview = ["pending", "in_review"].includes(s.latestStatus ?? "");
  const rejected =
    s.latestCase?.status === "rejected" && !!s.latestCase.rejection_reason;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Verificação de identidade"
        subtitle="Para liberar os saques, precisamos confirmar sua identidade com uma foto do seu documento."
      />

      {s.hasEnhanced && (
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

      {!s.hasEnhanced && inReview && (
        <div className={cn(CARD, "p-5")}>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-[#B7791F]" />
            <div>
              <p className="font-bold text-[#071D4A]">Verificação em análise</p>
              <p className="mt-1 text-sm text-[#5B6B88]">
                Recebemos seus documentos e estamos analisando
                {s.latestCase?.submitted_at
                  ? ` (enviados em ${formatDateTimeBR(s.latestCase.submitted_at)})`
                  : ""}
                . Você receberá um retorno por e-mail e nas notificações do
                painel.
              </p>
            </div>
          </div>
        </div>
      )}

      {!s.hasEnhanced && !inReview && rejected && (
        <InfoBanner tone="warning">
          <span className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#B7791F]" />
            <span>
              Não conseguimos concluir a última análise:{" "}
              {s.latestCase!.rejection_reason}. Envie os documentos novamente
              abaixo.
            </span>
          </span>
        </InfoBanner>
      )}

      {!s.hasEnhanced && !inReview && (
        <SectionCard
          title="Documento com foto"
          actions={
            <span className="inline-flex items-center rounded-full bg-[#ECF9F0] px-2.5 py-1 text-[12px] font-semibold text-[#1B8F45]">
              Obrigatório
            </span>
          }
        >
          <div className="mb-4 flex items-start gap-2 text-sm text-[#5B6B88]">
            <IdCard className="mt-0.5 size-4 shrink-0 text-[#0645D8]" />
            <span>
              Envie a <strong>frente</strong> e o <strong>verso</strong> de um
              documento oficial com foto (RG ou CNH) e uma <strong>selfie</strong>{" "}
              segurando o documento. Seus dados de cadastro já estão com a gente.
            </span>
          </div>
          <DocumentVerification />
        </SectionCard>
      )}
    </div>
  );
}
