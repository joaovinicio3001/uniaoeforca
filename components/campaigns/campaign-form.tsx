"use client";

import { useActionState, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialCampaignFormState } from "@/lib/campaigns/form-state";
import type { CampaignFormState } from "@/lib/campaigns/form-state";
import { CATEGORY_SLUGS } from "@/lib/campaigns/validation";

const CATEGORY_LABELS: Record<string, string> = {
  saude: "Saúde",
  emergencia: "Emergência",
  animais: "Animais",
  educacao: "Educação",
  familia: "Família",
  projetos: "Projetos",
  esportes: "Esportes",
  outros: "Outros",
};

type Action = (
  prev: CampaignFormState,
  fd: FormData,
) => Promise<CampaignFormState>;

export type CampaignFormInitial = {
  id?: string;
  title?: string;
  categorySlug?: string;
  summary?: string;
  story?: string;
  goalReais?: string;
  city?: string;
  state?: string;
};

export function CampaignForm({
  action,
  initial = {},
  submitLabel,
  editable = true,
}: {
  action: Action;
  initial?: CampaignFormInitial;
  submitLabel: string;
  editable?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialCampaignFormState);
  const [summary, setSummary] = useState(initial.summary ?? "");

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {initial.id && <input type="hidden" name="campaignId" value={initial.id} />}

      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.status === "success" && state.message && (
        <Alert variant="success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <fieldset disabled={!editable} className="space-y-5 disabled:opacity-70">
        <div>
          <Label htmlFor="title">Título da campanha</Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            defaultValue={initial.title}
            className="mt-1.5"
            placeholder="Ex.: Ajude o tratamento do João"
          />
          <FieldError errors={state.fieldErrors?.title} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="categorySlug">Categoria</Label>
            <select
              id="categorySlug"
              name="categorySlug"
              required
              defaultValue={initial.categorySlug ?? ""}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="" disabled>
                Selecione…
              </option>
              {CATEGORY_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {CATEGORY_LABELS[s]}
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors?.categorySlug} />
          </div>
          <div>
            <Label htmlFor="goalAmount">Meta (R$)</Label>
            <Input
              id="goalAmount"
              name="goalAmount"
              required
              inputMode="decimal"
              defaultValue={initial.goalReais}
              className="mt-1.5"
              placeholder="Ex.: 10000,00"
            />
            <FieldError errors={state.fieldErrors?.goalAmount} />
          </div>
        </div>

        <div>
          <Label htmlFor="summary">Resumo</Label>
          <Input
            id="summary"
            name="summary"
            required
            maxLength={200}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="mt-1.5"
            placeholder="Uma frase que explica a campanha (cards e compartilhamento)"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <FieldError errors={state.fieldErrors?.summary} />
            <span>{summary.length}/200</span>
          </div>
        </div>

        <div>
          <Label htmlFor="story">História</Label>
          <textarea
            id="story"
            name="story"
            rows={10}
            maxLength={20000}
            defaultValue={initial.story}
            className="mt-1.5 w-full rounded-md border border-input bg-card p-3 text-sm leading-relaxed"
            placeholder="Conte a história completa. Uma linha em branco separa parágrafos."
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Formatação básica é preservada; links são permitidos e abrem em nova aba.
          </p>
          <FieldError errors={state.fieldErrors?.story} />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              name="city"
              maxLength={80}
              defaultValue={initial.city}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="state">UF</Label>
            <Input
              id="state"
              name="state"
              maxLength={2}
              defaultValue={initial.state}
              className="mt-1.5 uppercase"
              placeholder="SP"
            />
            <FieldError errors={state.fieldErrors?.state} />
          </div>
        </div>
      </fieldset>

      {editable && <SubmitButton pendingText="Salvando…">{submitLabel}</SubmitButton>}
    </form>
  );
}
