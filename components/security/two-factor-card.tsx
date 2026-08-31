"use client";

import { useActionState, useState, useTransition } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";

import {
  activate2FAAction,
  disable2FAAction,
  startEnroll2FA,
  type TwoFactorState,
} from "@/app/(dashboard)/painel/seguranca/2fa-actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordInput } from "@/components/forms/password-input";

const initial: TwoFactorState = { status: "idle" };

const fieldCls =
  "h-11 w-full rounded-[11px] border border-[#DFE7F2] bg-white px-3.5 text-[16px] tracking-widest text-[#071D4A] outline-none focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]";

function Qr({ value }: { value: string }) {
  if (value.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={value}
        alt="QR code para o app autenticador"
        className="size-44 rounded-lg border bg-white p-2"
      />
    );
  }
  if (value.trim().startsWith("<svg")) {
    return (
      <div
        className="size-44 rounded-lg border bg-white p-2 [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }
  return <p className="text-xs text-[#5B6B88]">Use a chave abaixo para configurar.</p>;
}

export function TwoFactorCard({ enrolled }: { enrolled: boolean }) {
  const [enroll, setEnroll] = useState<
    { factorId: string; qr: string; secret: string } | null
  >(null);
  const [enrollErr, setEnrollErr] = useState<string | null>(null);
  const [starting, startStart] = useTransition();

  const [actState, activate] = useActionState(activate2FAAction, initial);
  const [disState, disable] = useActionState(disable2FAAction, initial);

  if (enrolled && disState.status !== "ok") {
    return (
      <div className="rounded-[16px] border border-[#DFE7F2] bg-white p-5">
        <p className="flex items-center gap-2 font-semibold text-[#071D4A]">
          <ShieldCheck className="size-4 text-[#20B85A]" /> Verificação em duas
          etapas ativa
        </p>
        <p className="mt-1 text-sm text-[#5B6B88]">
          A cada login pedimos um código do seu app autenticador.
        </p>
        <form action={disable} className="mt-4 space-y-2">
          {disState.status === "error" && disState.message && (
            <p className="text-sm text-[#8A1B12]">{disState.message}</p>
          )}
          <label className="block text-sm font-medium text-[#071D4A]">
            Para desativar, confirme sua senha
          </label>
          <PasswordInput
            name="password"
            autoComplete="current-password"
            required
            className="h-11 rounded-[11px] border-[#DFE7F2] bg-white text-[16px]"
          />
          <SubmitButton
            className="h-11 rounded-[11px] bg-[#B42318] px-4 text-sm font-semibold text-white hover:bg-[#9A1D14]"
            pendingText="Desativando…"
          >
            <ShieldOff className="size-4" /> Desativar 2FA
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#DFE7F2] bg-white p-5">
      <p className="flex items-center gap-2 font-semibold text-[#071D4A]">
        <ShieldCheck className="size-4 text-[#0645D8]" /> Verificação em duas
        etapas
      </p>
      <p className="mt-1 text-sm text-[#5B6B88]">
        Um segundo código, gerado por um app como Google Authenticator, Authy ou
        1Password, além da senha.
      </p>

      {(actState.status === "ok" || disState.status === "ok") && (
        <p className="mt-3 rounded-[10px] bg-[#ECF9F0] px-3 py-2 text-sm text-[#1B8F45]">
          {actState.message ?? disState.message}
        </p>
      )}

      {!enroll ? (
        <div className="mt-4">
          {enrollErr && (
            <p className="mb-2 text-sm text-[#8A1B12]">{enrollErr}</p>
          )}
          <button
            type="button"
            disabled={starting}
            onClick={() =>
              startStart(async () => {
                setEnrollErr(null);
                const r = await startEnroll2FA();
                if (r.ok) setEnroll(r);
                else setEnrollErr(r.error);
              })
            }
            className="h-11 rounded-[11px] bg-[#0645D8] px-4 text-sm font-semibold text-white hover:bg-[#0B4FE5] disabled:opacity-60"
          >
            {starting ? "Gerando…" : "Ativar verificação em duas etapas"}
          </button>
        </div>
      ) : (
        <form action={activate} className="mt-4 space-y-3">
          <input type="hidden" name="factorId" value={enroll.factorId} />
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <Qr value={enroll.qr} />
            <div className="min-w-0 text-sm text-[#5B6B88]">
              <p>1. Escaneie o QR no seu app autenticador.</p>
              <p className="mt-1">
                2. Ou digite a chave:
                <br />
                <code className="mt-1 inline-block break-all rounded bg-[#F2F5F9] px-2 py-1 text-[13px] text-[#071D4A]">
                  {enroll.secret}
                </code>
              </p>
              <p className="mt-1">3. Informe o código de 6 dígitos abaixo.</p>
            </div>
          </div>

          {actState.status === "error" && actState.message && (
            <p className="text-sm text-[#8A1B12]">{actState.message}</p>
          )}
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className={fieldCls}
            required
          />
          <SubmitButton
            className="h-11 rounded-[11px] bg-[#0645D8] px-4 text-sm font-semibold text-white hover:bg-[#0B4FE5]"
            pendingText="Confirmando…"
          >
            Confirmar e ativar
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
