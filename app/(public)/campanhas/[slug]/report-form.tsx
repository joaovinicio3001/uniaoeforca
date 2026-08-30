"use client";

import { useActionState } from "react";

import { reportCampaignAction } from "./actions";
import { initialCampaignFormState } from "@/lib/campaigns/form-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/forms/submit-button";

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "fraude", label: "Suspeita de fraude" },
  { value: "conteudo_improprio", label: "Conteúdo impróprio" },
  { value: "informacao_falsa", label: "Informação falsa" },
  { value: "direitos_autorais", label: "Violação de direitos autorais" },
  { value: "outro", label: "Outro" },
];

export function ReportForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(
    reportCampaignAction,
    initialCampaignFormState,
  );

  return (
    <details className="rounded-lg border text-sm">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium text-muted-foreground hover:text-foreground">
        Denunciar esta campanha
      </summary>
      <div className="border-t p-4">
        {state.status === "success" ? (
          <Alert variant="success">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : (
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="slug" value={slug} />
            {state.status === "error" && state.message && (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <div>
              <label htmlFor="reason" className="mb-1 block font-medium">
                Motivo
              </label>
              <select
                id="reason"
                name="reason"
                required
                className="h-10 w-full rounded-md border border-input bg-card px-3"
              >
                <option value="">Selecione…</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="details" className="mb-1 block font-medium">
                Detalhes (opcional)
              </label>
              <textarea
                id="details"
                name="details"
                rows={3}
                maxLength={1000}
                className="w-full rounded-md border border-input bg-card p-2"
              />
            </div>
            <SubmitButton variant="outline" size="sm">
              Enviar denúncia
            </SubmitButton>
          </form>
        )}
      </div>
    </details>
  );
}
