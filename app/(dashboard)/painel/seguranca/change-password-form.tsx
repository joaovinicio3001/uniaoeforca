"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { changePasswordAction } from "./actions";
import { initialFormState } from "@/app/(auth)/form-state";
import { AuthPasswordField } from "@/components/auth/auth-form-kit";
import { PasswordTips } from "./password-tips";

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-[#0645D8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B4FE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645D8]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 max-sm:w-full"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Atualizando…
        </>
      ) : (
        "Atualizar senha"
      )}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(
    changePasswordAction,
    initialFormState,
  );
  const [fields, setFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const lastStatus = useRef(state.status);

  useEffect(() => {
    if (state.status === lastStatus.current) return;
    lastStatus.current = state.status;
    if (state.status === "success") {
      toast.success(state.message ?? "Senha atualizada com sucesso.");
      setFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else if (state.status === "error" && state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state]);

  const mismatch = useMemo(
    () =>
      fields.confirmPassword.length > 0 &&
      fields.newPassword.length > 0 &&
      fields.confirmPassword !== fields.newPassword,
    [fields.confirmPassword, fields.newPassword],
  );

  const set =
    (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <form action={formAction} className="space-y-4" noValidate>
        {state.status === "error" && state.message && !state.fieldErrors && (
          <div
            className="rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]"
            role="alert"
          >
            {state.message}
          </div>
        )}

        <AuthPasswordField
          id="currentPassword"
          name="currentPassword"
          label="Senha atual"
          autoComplete="current-password"
          placeholder="Sua senha atual"
          required
          value={fields.currentPassword}
          onChange={set("currentPassword")}
          error={state.fieldErrors?.currentPassword?.[0]}
        />

        <AuthPasswordField
          id="newPassword"
          name="newPassword"
          label="Nova senha"
          autoComplete="new-password"
          placeholder="Nova senha"
          required
          value={fields.newPassword}
          onChange={set("newPassword")}
          error={state.fieldErrors?.newPassword?.[0]}
        />

        <AuthPasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar nova senha"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          required
          value={fields.confirmPassword}
          onChange={set("confirmPassword")}
          error={
            state.fieldErrors?.confirmPassword?.[0] ??
            (mismatch ? "As senhas não coincidem." : undefined)
          }
        />

        <SubmitBtn disabled={mismatch} />
      </form>

      <PasswordTips value={fields.newPassword} />
    </div>
  );
}
