"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UserRound } from "lucide-react";

import { addPixKeyAction } from "../actions";
import { initialWithdrawalFormState } from "@/lib/withdrawals/form-state";
import { PIX_KEY_TYPE_LABEL } from "@/lib/withdrawals/pix-keys";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

const fieldBase =
  "h-11 w-full rounded-[11px] border border-[#DFE7F2] bg-white px-3.5 text-[15px] text-[#071D4A] outline-none transition-shadow placeholder:text-[#9AA8BF] focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]";

export function PixKeyForm() {
  const [state, formAction] = useActionState(
    addPixKeyAction,
    initialWithdrawalFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const lastStatus = useRef(state.status);

  useEffect(() => {
    if (state.status === lastStatus.current) return;
    lastStatus.current = state.status;
    if (state.status === "success") {
      toast.success(state.message ?? "Chave PIX cadastrada.");
      formRef.current?.reset();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="type"
            className="mb-1.5 block text-sm font-semibold text-[#071D4A]"
          >
            Tipo de chave
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue=""
            className={fieldBase}
          >
            <option value="" disabled>
              Selecione o tipo
            </option>
            {Object.entries(PIX_KEY_TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.type} />
        </div>
        <div>
          <label
            htmlFor="value"
            className="mb-1.5 block text-sm font-semibold text-[#071D4A]"
          >
            Chave PIX
          </label>
          <input
            id="value"
            name="value"
            required
            maxLength={140}
            placeholder="Digite sua chave PIX"
            className={fieldBase}
          />
          <FieldError errors={state.fieldErrors?.value} />
        </div>
      </div>

      <div>
        <label
          htmlFor="ownerName"
          className="mb-1.5 block text-sm font-semibold text-[#071D4A]"
        >
          Nome do titular (opcional)
        </label>
        <div className="flex items-center rounded-[11px] border border-[#DFE7F2] bg-white focus-within:border-[#0645D8] focus-within:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]">
          <UserRound className="ml-3.5 size-[18px] shrink-0 text-[#5B6B88]" />
          <input
            id="ownerName"
            name="ownerName"
            maxLength={120}
            placeholder="Como consta no banco"
            className="h-11 w-full min-w-0 rounded-[11px] bg-transparent px-3 text-[15px] text-[#071D4A] outline-none placeholder:text-[#9AA8BF]"
          />
        </div>
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
