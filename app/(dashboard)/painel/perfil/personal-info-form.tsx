"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

import { updateProfileAction } from "./actions";
import { initialProfileFormState } from "@/lib/profile/form-state";
import { FieldError } from "@/components/forms/field-error";
import { cn } from "@/lib/utils";

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !dirty}
      aria-busy={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-[#0645D8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B4FE5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Salvando…
        </>
      ) : (
        "Salvar alterações"
      )}
    </button>
  );
}

function maskPhoneBR(value: string): string {
  const d = value.replace(/\D+/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const fieldBase =
  "h-11 w-full rounded-[11px] border bg-white px-3.5 text-[16px] text-[#071D4A] outline-none transition-shadow placeholder:text-[#9AA8BF] focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]";
const labelBase = "mb-1.5 block text-sm font-semibold text-[#071D4A]";
const readOnlyField =
  "flex h-11 items-center justify-between gap-2 rounded-[11px] border border-[#E4EBF5] bg-[#F7FAFD] px-3.5 text-[15px] text-[#5B6B88]";

type Props = {
  fullName: string;
  email: string | null;
  emailVerified: boolean;
  birthDate: string | null;
  cpfMasked: string | null;
  phone: string | null;
};

export function PersonalInfoForm({
  fullName,
  email,
  emailVerified,
  birthDate,
  cpfMasked,
  phone,
}: Props) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    initialProfileFormState,
  );
  const initial = useMemo(
    () => ({
      fullName,
      birthDate: birthDate ?? "",
      phone: phone ? maskPhoneBR(phone) : "",
    }),
    [fullName, birthDate, phone],
  );
  const [fields, setFields] = useState(initial);
  const lastStatus = useRef(state.status);

  // Sincroniza com novos dados vindos do servidor após um save.
  useEffect(() => {
    setFields(initial);
  }, [initial]);

  useEffect(() => {
    if (state.status === lastStatus.current) return;
    lastStatus.current = state.status;
    if (state.status === "success")
      toast.success(state.message ?? "Perfil atualizado.");
    else if (state.status === "error" && state.message)
      toast.error(state.message);
  }, [state]);

  const dirty =
    fields.fullName.trim() !== initial.fullName.trim() ||
    fields.birthDate !== initial.birthDate ||
    fields.phone.replace(/\D/g, "") !== initial.phone.replace(/\D/g, "");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="fullName" className={labelBase}>
          Nome completo
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Digite seu nome completo"
          value={fields.fullName}
          onChange={(e) =>
            setFields((f) => ({ ...f, fullName: e.target.value }))
          }
          aria-invalid={!!state.fieldErrors?.fullName || undefined}
          className={cn(
            fieldBase,
            state.fieldErrors?.fullName
              ? "border-[#D92D20] focus:border-[#D92D20]"
              : "border-[#DFE7F2]",
          )}
        />
        <FieldError errors={state.fieldErrors?.fullName} />
      </div>

      <div>
        <span className={labelBase}>E-mail</span>
        <div className={readOnlyField}>
          <span className="truncate text-[#071D4A]">{email ?? "—"}</span>
          {emailVerified && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ECF9F0] px-2 py-0.5 text-[12px] font-semibold text-[#1B8F45]">
              <CheckCircle2 className="size-3.5" /> Verificado
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[12px] text-[#5B6B88]">
          Para trocar o e-mail de acesso, use a{" "}
          <Link
            href="/painel/seguranca"
            className="font-medium text-[#0645D8] hover:underline"
          >
            área de Segurança
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="birthDate" className={labelBase}>
            Data de nascimento
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            value={fields.birthDate}
            onChange={(e) =>
              setFields((f) => ({ ...f, birthDate: e.target.value }))
            }
            aria-invalid={!!state.fieldErrors?.birthDate || undefined}
            className={cn(
              fieldBase,
              state.fieldErrors?.birthDate
                ? "border-[#D92D20] focus:border-[#D92D20]"
                : "border-[#DFE7F2]",
            )}
          />
          <FieldError errors={state.fieldErrors?.birthDate} />
        </div>
        <div>
          <span className={labelBase}>CPF</span>
          <div className={readOnlyField}>
            <span>{cpfMasked ?? "Não informado"}</span>
          </div>
          <p className="mt-1.5 text-[12px] text-[#5B6B88]">
            O CPF não pode ser alterado após o cadastro.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={labelBase}>
          Telefone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={fields.phone}
          onChange={(e) =>
            setFields((f) => ({ ...f, phone: maskPhoneBR(e.target.value) }))
          }
          aria-invalid={!!state.fieldErrors?.phone || undefined}
          className={cn(
            fieldBase,
            state.fieldErrors?.phone
              ? "border-[#D92D20] focus:border-[#D92D20]"
              : "border-[#DFE7F2]",
          )}
        />
        <FieldError errors={state.fieldErrors?.phone} />
      </div>

      <SaveButton dirty={dirty} />
    </form>
  );
}
