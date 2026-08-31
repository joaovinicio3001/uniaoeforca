"use client";

import Image from "next/image";
import { ArrowLeft, Info, Loader2, Send } from "lucide-react";

import type { CampaignMediaLite } from "@/lib/campaigns/form-state";
import { formatBRL } from "@/lib/utils";
import { type WizardDraft } from "@/lib/campaigns/wizard";
import { StepAlert, StepHeader } from "./wizard-ui";

type Props = {
  draft: WizardDraft;
  categoryName: string;
  media: CampaignMediaLite[];
  goalCents: number;
  submitting: boolean;
  error?: string;
  onBack: () => void;
  onSubmit: () => void;
};

export function StepReview({
  draft,
  categoryName,
  media,
  goalCents,
  submitting,
  error,
  onBack,
  onSubmit,
}: Props) {
  const cover = media.find((m) => m.isCover) ?? media[0];

  return (
    <div>
      <StepHeader
        title="Revise sua campanha"
        subtitle="Confira as informações antes de enviar para análise."
      />

      {error && <StepAlert>{error}</StepAlert>}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Resumo */}
        <div className="rounded-[16px] border border-[#E1E8F2] bg-white p-5">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[12px] bg-[#F7FAFE]">
            {cover ? (
              <Image
                src={cover.public_url}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-[#9AA8BF]">
                Sem imagem
              </div>
            )}
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Título" value={draft.title || "—"} />
            <Row label="Meta" value={formatBRL(goalCents)} />
            <Row label="Categoria" value={categoryName || "—"} />
            <Row label="Prazo" value="Indeterminado" />
            <Row
              label="Imagens"
              value={
                media.length === 0
                  ? "Nenhuma"
                  : `${media.length} ${media.length === 1 ? "imagem" : "imagens"}`
              }
            />
          </dl>
        </div>

        {/* História */}
        <div className="rounded-[16px] border border-[#E1E8F2] bg-white p-5">
          <h3 className="text-sm font-bold text-[#071D4A]">Sua história</h3>
          <div className="mt-3 max-h-[280px] overflow-y-auto whitespace-pre-wrap rounded-[10px] bg-[#F7FAFE] p-3.5 text-[13px] leading-relaxed text-[#43536F]">
            {draft.story.trim() || "—"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-[#CFE0FF] bg-[#EAF2FF] p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-[#0645D8]" />
        <p className="text-sm leading-relaxed text-[#1B3A70]">
          Ao enviar, sua campanha vai para a análise da nossa equipe. Você
          receberá um retorno quando a análise for concluída — só depois de
          aprovada ela fica pública.
        </p>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-[11px] border border-[#D9E3F0] bg-white px-5 text-[15px] font-semibold text-[#071D4A] transition-colors hover:bg-[#F7FAFE] disabled:opacity-60"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          aria-busy={submitting}
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-[11px] bg-[#0645D8] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(6,69,216,0.25)] transition-all hover:bg-[#0B55E8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Enviar para análise
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#EEF3FA] pb-2 last:border-0 last:pb-0">
      <dt className="shrink-0 text-[#5B6B88]">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-[#071D4A]">
        {value}
      </dd>
    </div>
  );
}
