"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { verifyLogin2faAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import { AuthAlert, AuthField, AuthSubmit } from "@/components/auth/auth-form-kit";

export function TwoFactorLoginForm() {
  const [state, formAction] = useActionState(
    verifyLogin2faAction,
    initialFormState,
  );
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/painel";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="redirect" value={redirectTo} />

      {state.status === "error" && state.message && (
        <AuthAlert variant="error">{state.message}</AuthAlert>
      )}

      <AuthField
        id="code"
        name="code"
        label="Código de verificação"
        icon={ShieldCheck}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        required
      />

      <AuthSubmit pendingText="Verificando…" icon={ShieldCheck}>
        Confirmar
      </AuthSubmit>

      <p className="pt-1 text-center text-sm text-[#5B6B88]">
        Perdeu o acesso ao app?{" "}
        <Link
          href="/ajuda"
          className="font-semibold text-[#0645D8] hover:underline"
        >
          Fale com o suporte
        </Link>
      </p>
    </form>
  );
}
