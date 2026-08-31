"use client";

import Link from "next/link";
import { Check, ClipboardList } from "lucide-react";

const NEXT_STEPS = [
  "Enviamos sua campanha para a análise da nossa equipe.",
  "Você receberá um retorno assim que a análise for concluída.",
  "Depois de aprovada, você poderá compartilhar o link e começar a receber apoio.",
];

export function StepSuccess({ campaignId }: { campaignId: string }) {
  return (
    <div className="mx-auto max-w-[520px] text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#EAF9EF]">
        <Check className="size-8 text-[#23B64B]" strokeWidth={2.5} />
      </span>

      <h2 className="mt-5 text-[22px] font-bold text-[#071D4A] sm:text-[26px]">
        Sua campanha foi enviada para análise!
      </h2>
      <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-[#5B6B88]">
        Agora nossa equipe vai revisar as informações. Você receberá um retorno
        assim que a análise for concluída.
      </p>

      <div className="mt-7 rounded-[16px] border border-[#E1E8F2] bg-white p-5 text-left">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#071D4A]">
          <ClipboardList className="size-4 text-[#0645D8]" />
          Próximos passos
        </h3>
        <ul className="mt-3 space-y-2.5">
          {NEXT_STEPS.map((step) => (
            <li key={step} className="flex gap-2.5 text-[13px] text-[#43536F]">
              <Check className="mt-0.5 size-4 shrink-0 text-[#23B64B]" />
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/painel/campanhas/${campaignId}`}
          className="inline-flex h-[50px] flex-1 items-center justify-center rounded-[11px] border border-[#D9E3F0] bg-white px-5 text-[15px] font-semibold text-[#071D4A] transition-colors hover:bg-[#F7FAFE]"
        >
          Ver a campanha
        </Link>
        <Link
          href="/painel/campanhas"
          className="inline-flex h-[50px] flex-1 items-center justify-center rounded-[11px] bg-[#0645D8] px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(6,69,216,0.25)] transition-colors hover:bg-[#0B55E8]"
        >
          Ver minhas campanhas
        </Link>
      </div>
    </div>
  );
}
