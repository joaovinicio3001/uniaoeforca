"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";

import { forgotPasswordAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import {
  AuthAlert,
  AuthField,
  AuthSubmit,
} from "@/components/auth/auth-form-kit";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    forgotPasswordAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
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
      />

      <AuthSubmit pendingText="Enviando…" icon={Send}>
        Enviar instruções
      </AuthSubmit>

      <p className="pt-1 text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-[#0645D8] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
