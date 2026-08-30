"use client";

import { useActionState } from "react";

import { addPixKeyAction } from "../actions";
import { initialWithdrawalFormState } from "@/lib/withdrawals/form-state";
import { PIX_KEY_TYPE_LABEL } from "@/lib/withdrawals/pix-keys";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

export function PixKeyForm() {
  const [state, formAction] = useActionState(
    addPixKeyAction,
    initialWithdrawalFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
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

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            name="type"
            required
            defaultValue=""
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {Object.entries(PIX_KEY_TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.type} />
        </div>
        <div>
          <Label htmlFor="value">Chave</Label>
          <Input id="value" name="value" required maxLength={140} className="mt-1.5" />
          <FieldError errors={state.fieldErrors?.value} />
        </div>
      </div>

      <div>
        <Label htmlFor="ownerName">Nome do titular da chave (opcional)</Label>
        <Input
          id="ownerName"
          name="ownerName"
          maxLength={120}
          className="mt-1.5"
          placeholder="Como consta no banco"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Por segurança, a chave só fica liberada para saque após um período de
        carência (cooldown). Guardamos a chave cifrada.
      </p>

      <SubmitButton size="sm" pendingText="Salvando…">
        Cadastrar chave
      </SubmitButton>
    </form>
  );
}
