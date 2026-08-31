"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  resetWithCodeAction,
  forgotPasswordAction,
} from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordInput } from "@/components/forms/password-input";
import { PasswordStrength } from "@/components/forms/password-strength";

export function RedefinirForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [state, formAction] = useActionState(
    resetWithCodeAction,
    initialFormState,
  );
  const [resendState, resendAction] = useActionState(
    forgotPasswordAction,
    initialFormState,
  );
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-4">
      {email && (
        <p className="text-sm text-muted-foreground">
          Código enviado para{" "}
          <strong className="text-foreground">{email}</strong>. Ele expira em 5
          minutos.
        </p>
      )}

      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
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

        <div>
          <Label htmlFor="password">Nova senha</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            className="mt-1.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordStrength value={password} />
          <FieldError errors={state.fieldErrors?.password} />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            className="mt-1.5"
          />
          <FieldError errors={state.fieldErrors?.confirmPassword} />
        </div>

        <SubmitButton className="w-full" pendingText="Salvando…">
          Redefinir senha
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
        <Link href="/login" className="text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
