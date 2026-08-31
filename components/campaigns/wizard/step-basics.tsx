"use client";

import { WIZARD_LIMITS, type WizardDraft } from "@/lib/campaigns/wizard";
import { cn } from "@/lib/utils";
import { MoneyInput } from "./money-input";
import {
  FieldError,
  FieldHelp,
  FieldLabel,
  StepHeader,
} from "./wizard-ui";

type Props = {
  draft: WizardDraft;
  update: <K extends keyof WizardDraft>(field: K, value: WizardDraft[K]) => void;
  errors: Record<string, string>;
};

const inputBase =
  "h-12 w-full rounded-[11px] border bg-white px-3.5 text-[16px] text-[#071D4A] outline-none transition-shadow placeholder:text-[#9AA8BF] focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]";

export function StepBasics({ draft, update, errors }: Props) {
  return (
    <div>
      <StepHeader
        title="Comece a criar sua campanha"
        subtitle="Vamos começar com algumas informações básicas."
      />

      <div className="space-y-5">
        <div>
          <FieldLabel
            htmlFor="wz-title"
            hint={`${draft.title.length}/${WIZARD_LIMITS.titleMax}`}
          >
            Título da campanha
          </FieldLabel>
          <input
            id="wz-title"
            type="text"
            maxLength={WIZARD_LIMITS.titleMax}
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Ex: Ajude a realizar um tratamento"
            aria-invalid={!!errors.title || undefined}
            className={cn(
              inputBase,
              errors.title
                ? "border-[#D92D20] focus:border-[#D92D20] focus:shadow-[0_0_0_3px_rgba(217,45,32,0.10)]"
                : "border-[#D9E3F0]",
            )}
          />
          <FieldHelp>Escolha um título claro e objetivo para sua campanha.</FieldHelp>
          <FieldError>{errors.title}</FieldError>
        </div>

        <div>
          <FieldLabel
            htmlFor="wz-summary"
            hint={`${draft.summary.length}/${WIZARD_LIMITS.summaryMax}`}
          >
            Resumo
          </FieldLabel>
          <input
            id="wz-summary"
            type="text"
            maxLength={WIZARD_LIMITS.summaryMax}
            value={draft.summary}
            onChange={(e) => update("summary", e.target.value)}
            placeholder="Uma frase que explica a campanha"
            aria-invalid={!!errors.summary || undefined}
            className={cn(
              inputBase,
              errors.summary
                ? "border-[#D92D20] focus:border-[#D92D20] focus:shadow-[0_0_0_3px_rgba(217,45,32,0.10)]"
                : "border-[#D9E3F0]",
            )}
          />
          <FieldHelp>
            Aparece nos cards e quando a campanha é compartilhada.
          </FieldHelp>
          <FieldError>{errors.summary}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor="wz-goal">Meta financeira</FieldLabel>
          <MoneyInput
            id="wz-goal"
            value={draft.goalReais}
            onChange={(next) => update("goalReais", next)}
            invalid={!!errors.goalReais}
          />
          <FieldHelp>Informe o valor que você deseja arrecadar.</FieldHelp>
          <FieldError>{errors.goalReais}</FieldError>
        </div>
      </div>
    </div>
  );
}
