"use client";

import { ArrowLeft, ArrowRight, CircleAlert, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Cabeçalho de etapa: título + subtítulo. */
export function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-[20px] font-bold text-[#071D4A] sm:text-[22px]">
        {title}
      </h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[#5B6B88]">
        {subtitle}
      </p>
    </div>
  );
}

/** Rótulo de campo padrão do wizard. */
export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[#071D4A]">
        {children}
      </label>
      {hint && <span className="text-[12px] text-[#5B6B88]">{hint}</span>}
    </div>
  );
}

export function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[12px] text-[#5B6B88]">{children}</p>;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p
      className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#D92D20]"
      role="alert"
    >
      <CircleAlert className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}

/** Alerta de erro geral da etapa. */
export function StepAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-5 flex items-start gap-2.5 rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]"
      role="alert"
      aria-live="polite"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#D92D20]" />
      <div>{children}</div>
    </div>
  );
}

/** Linha de ações Voltar / Continuar. */
export function WizardActions({
  onBack,
  onNext,
  backLabel = "Voltar",
  nextLabel = "Continuar",
  busy = false,
  busyLabel = "Salvando…",
  hideBack = false,
  nextIcon = true,
}: {
  onBack?: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  hideBack?: boolean;
  nextIcon?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center",
        hideBack ? "sm:justify-end" : "sm:justify-between",
      )}
    >
      {!hideBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-[11px] border border-[#D9E3F0] bg-white px-5 text-[15px] font-semibold text-[#071D4A] transition-colors hover:bg-[#F7FAFE] disabled:opacity-60 sm:w-auto"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex h-[50px] items-center justify-center gap-2 rounded-[11px] bg-[#0645D8] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(6,69,216,0.25)] transition-all hover:bg-[#0B55E8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {busyLabel}
          </>
        ) : (
          <>
            {nextLabel}
            {nextIcon && <ArrowRight className="size-4" />}
          </>
        )}
      </button>
    </div>
  );
}
