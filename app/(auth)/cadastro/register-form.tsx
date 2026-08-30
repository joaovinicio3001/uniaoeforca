"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { registerAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordStrength } from "@/components/forms/password-strength";
import { OAuthButtons } from "@/components/forms/oauth-buttons";
import { formatCPF } from "@/lib/validation/cpf";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialFormState);
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState({
    fullName: "",
    cpf: "",
    email: "",
    whatsapp: "",
  });

  // Devolve ao formulário o que a pessoa digitou quando o cadastro dá erro.
  useEffect(() => {
    if (state.values) {
      setFields((f) => ({ ...f, ...state.values }));
    }
  }, [state.values]);

  const set =
    (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setFields((f) => ({
        ...f,
        [key]: key === "cpf" ? formatCPF(raw) : raw,
      }));
    };

  return (
    <div className="space-y-4">
      <OAuthButtons label="cadastrar" />

      <form action={formAction} className="space-y-4" noValidate>
        {state.status === "error" && state.duplicate && (
          <Alert variant="warning">
            <AlertDescription>
              {state.message}{" "}
              <Link href="/login" className="font-medium underline">
                Entrar
              </Link>{" "}
              ·{" "}
              <Link href="/recuperar-senha" className="font-medium underline">
                Esqueci minha senha
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {state.status === "error" && !state.duplicate && state.message && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            className="mt-1.5"
            value={fields.fullName}
            onChange={set("fullName")}
          />
          <FieldError errors={state.fieldErrors?.fullName} />
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            inputMode="numeric"
            required
            className="mt-1.5"
            value={fields.cpf}
            onChange={set("cpf")}
            placeholder="000.000.000-00"
          />
          <FieldError errors={state.fieldErrors?.cpf} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1.5"
              value={fields.email}
              onChange={set("email")}
            />
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
              value={fields.whatsapp}
              onChange={set("whatsapp")}
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
            Tenho 18 anos ou mais e aceito os{" "}
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
          <span>Quero receber novidades e dicas por e-mail (opcional).</span>
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
    </div>
  );
}
