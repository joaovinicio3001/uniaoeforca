"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  resendEmailOtpAction,
  verifyEmailOtpAction,
} from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

export function ConfirmOtpForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [state, formAction] = useActionState(
    verifyEmailOtpAction,
    initialFormState,
  );
  const [resendState, resendAction] = useActionState(
    resendEmailOtpAction,
    initialFormState,
  );

  return (
    <div className="space-y-4">
      {email && (
        <p className="text-sm text-muted-foreground">
          Código enviado para <strong className="text-foreground">{email}</strong>
          .
        </p>
      )}

      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {resendState.status === "success" && resendState.message && (
        <Alert variant="success">
          <AlertDescription>{resendState.message}</AlertDescription>
        </Alert>
      )}
      {resendState.status === "error" && resendState.message && (
        <Alert variant="warning">
          <AlertDescription>{resendState.message}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="email" value={email} />
        <div>
          <Label htmlFor="token">Código de 6 dígitos</Label>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            placeholder="000000"
            className="mt-1.5 text-center text-lg tracking-[0.5em]"
          />
          <FieldError errors={state.fieldErrors?.token} />
        </div>

        <SubmitButton className="w-full" pendingText="Confirmando…">
          Confirmar e entrar
        </SubmitButton>
      </form>

      <form action={resendAction} className="text-center">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          className="text-sm font-medium text-primary hover:underline"
        >
          Não recebeu? Reenviar código
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        E-mail errado?{" "}
        <Link href="/cadastro" className="font-medium text-primary hover:underline">
          Voltar ao cadastro
        </Link>
      </p>
    </div>
  );
}
