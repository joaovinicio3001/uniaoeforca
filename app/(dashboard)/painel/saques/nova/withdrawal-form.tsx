"use client";

import { useActionState, useState } from "react";

import { requestWithdrawalAction } from "../actions";
import { initialWithdrawalFormState } from "@/lib/withdrawals/form-state";
import { PIX_KEY_TYPE_LABEL, type PixKeyType } from "@/lib/withdrawals/pix-keys";
import { formatBRL } from "@/lib/utils";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordInput } from "@/components/forms/password-input";

type Key = { id: string; type: PixKeyType; masked: string };

const fieldBase =
  "h-11 w-full rounded-[11px] border border-[#DFE7F2] bg-white px-3.5 text-[16px] text-[#071D4A] outline-none transition-shadow placeholder:text-[#9AA8BF] focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]";
const labelBase = "mb-1.5 block text-sm font-semibold text-[#071D4A]";

export function WithdrawalForm({
  keys,
  availableCents,
  feeCents,
}: {
  keys: Key[];
  availableCents: number;
  feeCents: number;
}) {
  const [state, formAction] = useActionState(
    requestWithdrawalAction,
    initialWithdrawalFormState,
  );
  const [amount, setAmount] = useState(
    (availableCents / 100).toFixed(2).replace(".", ","),
  );

  const amountCents =
    Math.round(Number(amount.replace(/\./g, "").replace(",", ".")) * 100) || 0;
  const net = Math.max(0, amountCents - feeCents);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === "error" && state.message && (
        <div className="rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="pixKeyId" className={labelBase}>
          Chave PIX de destino
        </label>
        <select
          id="pixKeyId"
          name="pixKeyId"
          required
          defaultValue={keys[0]?.id ?? ""}
          className={fieldBase}
        >
          {keys.map((k) => (
            <option key={k.id} value={k.id}>
              {PIX_KEY_TYPE_LABEL[k.type]} · {k.masked}
            </option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.pixKeyId} />
      </div>

      <div>
        <label htmlFor="amount" className={labelBase}>
          Valor do saque
        </label>
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={fieldBase}
        />
        <p className="mt-1.5 text-[13px] text-[#5B6B88]">
          Disponível: {formatBRL(availableCents)}
        </p>
        <FieldError errors={state.fieldErrors?.amount} />
      </div>

      <div className="rounded-[12px] border border-[#DFE7F2] bg-[#F7FAFD] p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-[#5B6B88]">Valor solicitado</span>
          <span className="tabular-nums text-[#071D4A]">
            {formatBRL(amountCents)}
          </span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-[#5B6B88]">Taxa de saque</span>
          <span className="tabular-nums text-[#071D4A]">
            − {formatBRL(feeCents)}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t border-[#E4EBF5] pt-2 font-bold">
          <span className="text-[#071D4A]">Você recebe</span>
          <span className="tabular-nums text-[#20B85A]">{formatBRL(net)}</span>
        </div>
      </div>

      <div>
        <label htmlFor="password" className={labelBase}>
          Confirme sua senha
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-[11px] border-[#DFE7F2] bg-white text-[16px] text-[#071D4A] focus-visible:ring-2 focus-visible:ring-[#0645D8]/20"
        />
        <p className="mt-1.5 text-[13px] text-[#5B6B88]">
          Confirme a sua senha para autorizar o saque.
        </p>
        <FieldError errors={state.fieldErrors?.password} />
      </div>

      <p className="text-[13px] leading-relaxed text-[#5B6B88]">
        Ao solicitar, o valor sai do seu saldo disponível na hora e o pedido
        entra em análise. O repasse costuma cair em até 24 horas.
      </p>

      <SubmitButton
        className="h-12 w-full rounded-[11px] bg-[#0645D8] text-[15px] font-semibold hover:bg-[#0B4FE5]"
        pendingText="Enviando…"
      >
        Solicitar saque
      </SubmitButton>
    </form>
  );
}
