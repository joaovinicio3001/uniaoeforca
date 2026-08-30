"use client";

import { useActionState } from "react";

import { submitBasicKycAction, submitEnhancedKycAction } from "./actions";
import { initialKycFormState } from "@/lib/kyc/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

export function BasicKycForm() {
  const [state, action] = useActionState(submitBasicKycAction, initialKycFormState);
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {(state.status === "success" || state.status === "review") && state.message && (
        <Alert variant={state.status === "success" ? "success" : "warning"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <div>
        <Label htmlFor="fullName">Nome completo (como no documento)</Label>
        <Input id="fullName" name="fullName" required maxLength={120} className="mt-1.5" />
        <FieldError errors={state.fieldErrors?.fullName} />
      </div>
      <div>
        <Label htmlFor="birthDate">Data de nascimento</Label>
        <Input id="birthDate" name="birthDate" type="date" required className="mt-1.5" />
        <FieldError errors={state.fieldErrors?.birthDate} />
      </div>
      <SubmitButton size="sm" pendingText="Verificando…">
        Verificar identidade
      </SubmitButton>
    </form>
  );
}

export function EnhancedKycForm() {
  const [state, action] = useActionState(
    submitEnhancedKycAction,
    initialKycFormState,
  );
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.status === "review" && state.message && (
        <Alert variant="warning">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {(["id_front", "id_back", "selfie"] as const).map((k) => (
        <div key={k}>
          <Label htmlFor={k}>
            {k === "id_front"
              ? "Documento — frente"
              : k === "id_back"
                ? "Documento — verso (opcional)"
                : "Selfie segurando o documento"}
          </Label>
          <input
            id={k}
            name={k}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Seus documentos ficam guardados em local privado, com acesso restrito à
        equipe de verificação.
      </p>
      <SubmitButton size="sm" pendingText="Enviando…">
        Enviar documentos
      </SubmitButton>
    </form>
  );
}
