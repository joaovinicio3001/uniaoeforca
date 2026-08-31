"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IdCard } from "lucide-react";

import { addPixKeyAction } from "../actions";
import { initialWithdrawalFormState } from "@/lib/withdrawals/form-state";
import { formatCPF } from "@/lib/validation/cpf";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

const fieldBase =
  "h-11 w-full rounded-[11px] border border-[#DFE7F2] bg-white px-3.5 text-[16px] text-[#071D4A] outline-none transition-shadow placeholder:text-[#9AA8BF] focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]";

export function PixKeyForm({ cpfLast3 }: { cpfLast3: string | null }) {
  const [state, formAction] = useActionState(
    addPixKeyAction,
    initialWithdrawalFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [cpf, setCpf] = useState("");
  const lastStatus = useRef(state.status);

  useEffect(() => {
    if (state.status === lastStatus.current) return;
    lastStatus.current = state.status;
    if (state.status === "success") {
      toast.success(state.message ?? "Chave PIX cadastrada.");
      formRef.current?.reset();
      setCpf("");
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="type" value="cpf" />

      <div>
        <label
          htmlFor="value"
          className="mb-1.5 block text-sm font-semibold text-[#071D4A]"
        >
          Chave PIX (CPF)
        </label>
        <div
          className={
            "flex items-center rounded-[11px] border bg-white transition-shadow focus-within:border-[#0645D8] focus-within:shadow-[0_0_0_3px_rgba(6,69,216,0.10)] " +
            (state.fieldErrors?.value ? "border-[#D92D20]" : "border-[#DFE7F2]")
          }
        >
          <IdCard className="ml-3.5 size-[18px] shrink-0 text-[#5B6B88]" />
          <input
            id="value"
            name="value"
            inputMode="numeric"
            autoComplete="off"
            required
            maxLength={14}
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            className="h-11 w-full min-w-0 rounded-[11px] bg-transparent px-3 text-[16px] text-[#071D4A] outline-none placeholder:text-[#9AA8BF]"
          />
        </div>
        <p className="mt-1.5 text-[12px] text-[#5B6B88]">
          Por segurança, o saque só vai para o CPF cadastrado na sua conta
          {cpfLast3 ? ` (final ${cpfLast3})` : ""}. Só aceitamos chave PIX do
          tipo CPF.
        </p>
        <FieldError errors={state.fieldErrors?.value} />
        <FieldError errors={state.fieldErrors?.type} />
      </div>

      <div>
        <label
          htmlFor="ownerName"
          className="mb-1.5 block text-sm font-semibold text-[#071D4A]"
        >
          Nome do titular (opcional)
        </label>
        <input
          id="ownerName"
          name="ownerName"
          maxLength={120}
          placeholder="Como consta no banco"
          className={fieldBase}
        />
      </div>

      <SubmitButton
        className="h-11 w-full rounded-[11px] bg-[#0645D8] font-semibold hover:bg-[#0B4FE5]"
        pendingText="Salvando…"
      >
        Cadastrar chave
      </SubmitButton>
    </form>
  );
}
