"use client";

import { useActionState } from "react";

import { addUpdateAction } from "@/app/(dashboard)/painel/campanhas/actions";
import { initialCampaignFormState } from "@/lib/campaigns/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

export function UpdateComposer({ campaignId }: { campaignId: string }) {
  const [state, formAction] = useActionState(
    addUpdateAction,
    initialCampaignFormState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />
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
      <div>
        <Label htmlFor="up-title">Título</Label>
        <Input id="up-title" name="title" required maxLength={140} className="mt-1.5" />
        <FieldError errors={state.fieldErrors?.title} />
      </div>
      <div>
        <Label htmlFor="up-body">Mensagem</Label>
        <textarea
          id="up-body"
          name="body"
          required
          rows={5}
          maxLength={10000}
          className="mt-1.5 w-full rounded-md border border-input bg-card p-3 text-sm"
        />
        <FieldError errors={state.fieldErrors?.body} />
      </div>
      <SubmitButton size="sm" pendingText="Publicando…">
        Publicar atualização
      </SubmitButton>
    </form>
  );
}
