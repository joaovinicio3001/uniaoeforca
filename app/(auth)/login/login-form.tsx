"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { loginAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialFormState);
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/painel";
  const linkError = params.get("erro");

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="redirect" value={redirectTo} />

        {linkError === "link-invalido" && (
          <Alert variant="warning">
            <AlertDescription>
              O link não é mais válido. Faça login ou solicite um novo.
            </AlertDescription>
          </Alert>
        )}

      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.email} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/recuperar-senha"
            className="text-xs text-primary hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.password} />
      </div>

      <SubmitButton className="w-full" pendingText="Entrando…">
        Entrar
      </SubmitButton>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-primary hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
