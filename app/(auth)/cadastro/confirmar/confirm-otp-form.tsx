"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import {
  resendEmailOtpAction,
  verifyEmailOtpAction,
} from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import {
  AuthAlert,
  AuthSubmit,
  OtpField,
} from "@/components/auth/auth-form-kit";

export function ConfirmOtpForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const rawRedirect = params.get("redirect") ?? "";
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "";
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
        <p className="text-sm text-[#5B6B88]">
          Código enviado para{" "}
          <strong className="font-semibold text-[#071D4A]">{email}</strong>. Ele
          expira em 5 minutos.
        </p>
      )}

      {state.status === "error" && state.message && (
        <AuthAlert variant="error">{state.message}</AuthAlert>
      )}
      {resendState.status === "success" && resendState.message && (
        <AuthAlert variant="success">{resendState.message}</AuthAlert>
      )}
      {resendState.status === "error" && resendState.message && (
        <AuthAlert variant="warning">{resendState.message}</AuthAlert>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="email" value={email} />
        {redirectTo && (
          <input type="hidden" name="redirect" value={redirectTo} />
        )}
        <OtpField error={state.fieldErrors?.token?.[0]} />
        <AuthSubmit pendingText="Confirmando…" icon={CheckCircle2}>
          Confirmar e entrar
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
        E-mail errado?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-[#0645D8] hover:underline"
        >
          Voltar ao cadastro
        </Link>
      </p>
    </div>
  );
}
