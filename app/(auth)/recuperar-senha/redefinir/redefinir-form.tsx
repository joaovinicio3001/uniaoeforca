"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, MailCheck } from "lucide-react";

import {
  forgotPasswordAction,
  resetWithCodeAction,
} from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import {
  AuthAlert,
  AuthPasswordField,
  AuthSubmit,
  OtpField,
  PasswordChecklist,
} from "@/components/auth/auth-form-kit";

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
  const [confirm, setConfirm] = useState("");

  const mismatch = useMemo(
    () => confirm.length > 0 && password.length > 0 && confirm !== password,
    [confirm, password],
  );

  return (
    <div className="space-y-4">
      {email && (
        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#B8E9C9] bg-[#EAF9EF] px-3.5 py-3 text-sm text-[#12622E]">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-[#23B64B]" />
          <div>
            Enviamos um código para{" "}
            <strong className="font-semibold">{email}</strong>. Ele expira em 5
            minutos.
          </div>
        </div>
      )}

      {state.status === "error" && state.message && (
        <AuthAlert variant="error">{state.message}</AuthAlert>
      )}
      {resendState.status === "error" && resendState.message && (
        <AuthAlert variant="warning">{resendState.message}</AuthAlert>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="email" value={email} />

        <OtpField error={state.fieldErrors?.token?.[0]} />

        <div>
          <AuthPasswordField
            id="password"
            name="password"
            label="Nova senha"
            autoComplete="new-password"
            placeholder="Digite sua nova senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={state.fieldErrors?.password?.[0]}
          />
          <PasswordChecklist value={password} />
        </div>

        <AuthPasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar nova senha"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={
            state.fieldErrors?.confirmPassword?.[0] ??
            (mismatch ? "As senhas não coincidem." : undefined)
          }
        />

        <AuthSubmit pendingText="Redefinindo…" icon={KeyRound}>
          Redefinir senha
        </AuthSubmit>
      </form>

      <form action={resendAction} className="text-center">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          className="text-sm font-medium text-[#0645D8] hover:underline"
        >
          Não recebeu? Reenviar código
        </button>
      </form>

      <p className="text-center text-sm text-[#5B6B88]">
        <Link
          href="/login"
          className="font-medium text-[#0645D8] hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
