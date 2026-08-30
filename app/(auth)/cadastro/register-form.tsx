"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { registerAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordStrength } from "@/components/forms/password-strength";
import { formatCPF } from "@/lib/validation/cpf";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialFormState);
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");

  if (state.status === "check-email") {
    return (
      <Alert variant="success">
        <AlertTitle>Confirme seu e-mail</AlertTitle>
        <AlertDescription>
          {state.message} Assim que confirmar, é só entrar.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required className="mt-1.5" />
        <FieldError errors={state.fieldErrors?.fullName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            inputMode="numeric"
            required
            className="mt-1.5"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
          />
          <FieldError errors={state.fieldErrors?.cpf} />
        </div>
        <div>
          <Label htmlFor="birthDate">Data de nascimento</Label>
          <Input id="birthDate" name="birthDate" type="date" required className="mt-1.5" />
          <FieldError errors={state.fieldErrors?.birthDate} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="mt-1.5" />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            inputMode="tel"
            required
            className="mt-1.5"
            placeholder="(11) 90000-0000"
          />
          <FieldError errors={state.fieldErrors?.whatsapp} />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
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
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
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

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acceptTerms" className="mt-0.5" required />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="text-primary hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      <FieldError errors={state.fieldErrors?.acceptTerms} />

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="marketingOptIn" className="mt-0.5" />
        <span>
          Quero receber novidades e dicas por e-mail (opcional, doc §6.1 —
          consentimento separado).
        </span>
      </label>

      <SubmitButton className="w-full" pendingText="Criando conta…">
        Criar conta
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
