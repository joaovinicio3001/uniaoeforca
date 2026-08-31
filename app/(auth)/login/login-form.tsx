"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn, Mail } from "lucide-react";

import { loginAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSubmit,
} from "@/components/auth/auth-form-kit";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialFormState);
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/painel";
  const linkError = params.get("erro");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="redirect" value={redirectTo} />

      {linkError === "link-invalido" && (
        <AuthAlert variant="warning">
          O link não é mais válido. Faça login ou{" "}
          <Link href="/recuperar-senha">solicite um novo</Link>.
        </AuthAlert>
      )}

      {state.status === "error" && state.message && (
        <AuthAlert variant="error">{state.message}</AuthAlert>
      )}

      <AuthField
        id="email"
        name="email"
        label="E-mail"
        icon={Mail}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="seu@email.com"
        required
        error={state.fieldErrors?.email?.[0]}
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#071D4A]">Senha</span>
          <Link
            href="/recuperar-senha"
            className="text-[13px] font-medium text-[#0645D8] hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <AuthPasswordField
          id="password"
          name="password"
          label=""
          aria-label="Senha"
          autoComplete="current-password"
          placeholder="Sua senha"
          required
          error={state.fieldErrors?.password?.[0]}
        />
      </div>

      <AuthSubmit pendingText="Entrando…" icon={LogIn}>
        Entrar
      </AuthSubmit>

      <p className="pt-1 text-center text-sm text-[#5B6B88]">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-[#0645D8] hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
