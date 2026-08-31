"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";

import { submitBasicKycAction, submitEnhancedKycAction } from "./actions";
import { initialKycFormState } from "@/lib/kyc/form-state";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { DocumentUploader } from "./document-uploader";

const fieldBase =
  "h-11 w-full rounded-[11px] border border-[#DFE7F2] bg-white px-3.5 text-[16px] text-[#071D4A] outline-none transition-shadow placeholder:text-[#9AA8BF] focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]";
const labelBase = "mb-1.5 block text-sm font-semibold text-[#071D4A]";

/* ------------------------------------------------------------------ *
 * 1. Dados pessoais
 * ------------------------------------------------------------------ */
export function BasicKycForm() {
  const [state, action] = useActionState(
    submitBasicKycAction,
    initialKycFormState,
  );
  const last = useRef(state.status);

  useEffect(() => {
    if (state.status === last.current) return;
    last.current = state.status;
    if (state.status === "success") toast.success(state.message ?? "Dados confirmados.");
    else if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <form action={action} className="space-y-4" noValidate>
        {state.status === "error" && state.message && (
          <div className="rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]">
            {state.message}
          </div>
        )}
        {(state.status === "success" || state.status === "review") &&
          state.message && (
            <div
              className={
                state.status === "success"
                  ? "rounded-[12px] border border-[#B8E9C9] bg-[#ECF9F0] px-3.5 py-3 text-sm text-[#12622E]"
                  : "rounded-[12px] border border-[#FBE1A8] bg-[#FFF8DF] px-3.5 py-3 text-sm text-[#7A5312]"
              }
            >
              {state.message}
            </div>
          )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className={labelBase}>
              Nome completo (como no documento)
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              maxLength={120}
              placeholder="Digite seu nome completo"
              autoComplete="name"
              className={fieldBase}
            />
            <FieldError errors={state.fieldErrors?.fullName} />
          </div>
          <div>
            <label htmlFor="birthDate" className={labelBase}>
              Data de nascimento
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              required
              className={fieldBase}
            />
            <FieldError errors={state.fieldErrors?.birthDate} />
          </div>
        </div>

        <SubmitButton
          className="h-11 rounded-[11px] bg-[#0645D8] px-5 font-semibold hover:bg-[#0B4FE5]"
          pendingText="Verificando…"
        >
          Confirmar dados
        </SubmitButton>
      </form>

      <aside className="rounded-[14px] border border-[#DCE8FF] bg-[#EDF4FF] p-5">
        <ShieldCheck className="size-8 text-[#0645D8]" />
        <p className="mt-3 text-sm font-bold text-[#071D4A]">
          Suas informações ficam seguras
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#5B6B88]">
          Usamos medidas de segurança para proteger seus dados pessoais durante
          o processo de verificação.
        </p>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 2. Documento com foto
 * ------------------------------------------------------------------ */
const TIPS = [
  {
    title: "Documento válido e legível",
    text: "Evite fotos cortadas ou imagens desfocadas.",
  },
  {
    title: "Boa iluminação",
    text: "Ambiente claro, sem reflexos ou sombras.",
  },
  {
    title: "Selfie nítida",
    text: "Mostre seu rosto e o documento com clareza.",
  },
];

export function EnhancedKycForm() {
  const [state, action] = useActionState(
    submitEnhancedKycAction,
    initialKycFormState,
  );
  const last = useRef(state.status);

  useEffect(() => {
    if (state.status === last.current) return;
    last.current = state.status;
    if (state.status === "review") toast.success(state.message ?? "Documentos enviados.");
    else if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <form action={action} className="space-y-4" noValidate>
        {state.status === "error" && state.message && (
          <div className="rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]">
            {state.message}
          </div>
        )}
        {state.status === "review" && state.message && (
          <div className="rounded-[12px] border border-[#FBE1A8] bg-[#FFF8DF] px-3.5 py-3 text-sm text-[#7A5312]">
            {state.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <DocumentUploader name="id_front" label="Documento — frente" />
          <DocumentUploader name="id_back" label="Documento — verso" optional />
          <DocumentUploader
            name="selfie"
            label="Selfie segurando o documento"
          />
        </div>

        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#DFE7F2] bg-[#F7FAFD] px-3.5 py-3 text-[13px] text-[#5B6B88]">
          <Lock className="mt-0.5 size-4 shrink-0 text-[#5B6B88]" />
          Seus documentos ficam armazenados em ambiente protegido e o acesso é
          restrito ao processo de verificação.
        </div>

        <SubmitButton
          className="h-11 rounded-[11px] bg-[#0645D8] px-5 font-semibold hover:bg-[#0B4FE5]"
          pendingText="Enviando…"
        >
          Enviar documentos
        </SubmitButton>
      </form>

      <aside className="rounded-[14px] border border-[#C7ECD5] bg-[#ECF9F0] p-5">
        <p className="text-sm font-bold text-[#071D4A]">
          Dicas para um envio aceito
        </p>
        <ul className="mt-3 space-y-3">
          {TIPS.map((t) => (
            <li key={t.title} className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#20B85A]" />
              <div>
                <p className="text-[13px] font-semibold text-[#071D4A]">
                  {t.title}
                </p>
                <p className="text-[12px] leading-snug text-[#5B6B88]">
                  {t.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
