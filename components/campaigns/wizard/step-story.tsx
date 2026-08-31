"use client";

import { Heart, PenLine, RefreshCw, Target } from "lucide-react";

import { WIZARD_LIMITS, type WizardDraft } from "@/lib/campaigns/wizard";
import { cn } from "@/lib/utils";
import { FieldError, FieldHelp, FieldLabel, StepHeader } from "./wizard-ui";

type Props = {
  draft: WizardDraft;
  update: <K extends keyof WizardDraft>(field: K, value: WizardDraft[K]) => void;
  errors: Record<string, string>;
};

const TIPS = [
  {
    icon: Heart,
    title: "Seja verdadeiro",
    text: "Conte sua história com sinceridade.",
  },
  {
    icon: Target,
    title: "Explique o motivo",
    text: "Diga por que você precisa de apoio.",
  },
  {
    icon: PenLine,
    title: "Fale sobre o impacto",
    text: "Mostre como as doações vão ajudar.",
  },
  {
    icon: RefreshCw,
    title: "Atualize depois",
    text: "Mantenha os apoiadores informados.",
  },
];

export function StepStory({ draft, update, errors }: Props) {
  return (
    <div>
      <StepHeader
        title="Conte a sua história"
        subtitle="Explique o motivo da sua campanha. Quanto mais você compartilhar, mais as pessoas se conectam."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <FieldLabel
            htmlFor="wz-story"
            hint={`${draft.story.length}/${WIZARD_LIMITS.storyMax}`}
          >
            Sua história
          </FieldLabel>
          <textarea
            id="wz-story"
            rows={12}
            maxLength={WIZARD_LIMITS.storyMax}
            value={draft.story}
            onChange={(e) => update("story", e.target.value)}
            placeholder="Escreva aqui sua história..."
            aria-invalid={!!errors.story || undefined}
            className={cn(
              "w-full rounded-[12px] border bg-white p-3.5 text-[16px] leading-relaxed text-[#071D4A] outline-none transition-shadow placeholder:text-[#9AA8BF] focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]",
              errors.story
                ? "border-[#D92D20] focus:border-[#D92D20] focus:shadow-[0_0_0_3px_rgba(217,45,32,0.10)]"
                : "border-[#D9E3F0]",
            )}
          />
          <FieldHelp>
            Uma linha em branco separa parágrafos. Links são preservados e abrem
            em nova aba.
          </FieldHelp>
          <FieldError>{errors.story}</FieldError>
        </div>

        <aside className="rounded-[16px] border border-[#E1E8F2] bg-[#F7FAFE] p-5">
          <h3 className="text-sm font-bold text-[#071D4A]">
            Dicas para uma boa história
          </h3>
          <ul className="mt-3 space-y-3.5">
            {TIPS.map((tip) => (
              <li key={tip.title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#0645D8]">
                  <tip.icon className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[#071D4A]">
                    {tip.title}
                  </p>
                  <p className="text-[12px] leading-snug text-[#5B6B88]">
                    {tip.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
