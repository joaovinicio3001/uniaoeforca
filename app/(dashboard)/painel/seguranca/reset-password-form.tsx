"use client";

import { useActionState, useState } from "react";

import { resetPasswordAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordStrength } from "@/components/forms/password-strength";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    resetPasswordAction,
    initialFormState,
  );
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="max-w-sm space-y-4" noValidate>
      {state.status === "success" && state.message && (
        <Alert variant="success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
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
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.confirmPassword} />
      </div>

      <SubmitButton pendingText="Salvando…">Atualizar senha</SubmitButton>
    </form>
  );
}
