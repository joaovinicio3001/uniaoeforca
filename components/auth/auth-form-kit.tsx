"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import {
  Check,
  CircleAlert,
  CircleCheckBig,
  Eye,
  EyeOff,
  Loader2,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Campo de texto com ícone à esquerda
 * ------------------------------------------------------------------ */
type FieldProps = React.ComponentProps<"input"> & {
  /** Rótulo visível. Omita (ou passe vazio) quando houver um `aria-label`. */
  label?: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  hint?: string;
  /** Slot à direita dentro do campo (ex.: botão de mostrar senha). */
  rightSlot?: React.ReactNode;
};

export const AuthField = React.forwardRef<HTMLInputElement, FieldProps>(
  function AuthField(
    { label, icon: Icon, error, hint, rightSlot, id, className, ...props },
    ref,
  ) {
    const fieldId = id ?? props.name;
    const describedBy =
      [error ? `${fieldId}-error` : null, hint ? `${fieldId}-hint` : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div>
        {label ? (
          <label
            htmlFor={fieldId}
            className="mb-1.5 block text-sm font-semibold text-[#071D4A]"
          >
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            "flex items-center rounded-[11px] border bg-white transition-shadow",
            "border-[#D9E3F0] focus-within:border-[#0645D8] focus-within:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]",
            error &&
              "border-[#D92D20] focus-within:border-[#D92D20] focus-within:shadow-[0_0_0_3px_rgba(217,45,32,0.10)]",
          )}
        >
          <Icon className="ml-3.5 size-[18px] shrink-0 text-[#5B6B88]" />
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-12 w-full min-w-0 flex-1 rounded-[11px] bg-transparent px-3 text-[16px] text-[#071D4A] outline-none placeholder:text-[#9AA8BF] disabled:cursor-not-allowed disabled:opacity-60",
              className,
            )}
            {...props}
          />
          {rightSlot}
        </div>
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="mt-1.5 text-[12px] text-[#5B6B88]">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${fieldId}-error`}
            className="mt-1.5 text-[12px] font-medium text-[#D92D20]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

/* ------------------------------------------------------------------ *
 * Campo de código de 6 dígitos (OTP)
 * ------------------------------------------------------------------ */
export function OtpField({
  error,
  label = "Código de 6 dígitos",
  name = "token",
  id = "token",
}: {
  error?: string;
  label?: string;
  name?: string;
  id?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-[#071D4A]"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d*"
        maxLength={6}
        required
        placeholder="000000"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "h-14 w-full rounded-[11px] border bg-white text-center text-[24px] font-semibold tracking-[0.4em] text-[#071D4A] outline-none transition-shadow placeholder:tracking-[0.4em] placeholder:text-[#C6D2E4]",
          "border-[#D9E3F0] focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]",
          error &&
            "border-[#D92D20] focus:border-[#D92D20] focus:shadow-[0_0_0_3px_rgba(217,45,32,0.10)]",
        )}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-[12px] font-medium text-[#D92D20]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Campo de senha (herda AuthField + botão mostrar/ocultar)
 * ------------------------------------------------------------------ */
type PasswordFieldProps = Omit<FieldProps, "icon" | "rightSlot" | "type"> & {
  icon?: React.ComponentType<{ className?: string }>;
};

export const AuthPasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(function AuthPasswordField({ icon, ...props }, ref) {
  const [show, setShow] = React.useState(false);
  const LockIcon =
    icon ??
    function Lock({ className }: { className?: string }) {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    };

  return (
    <AuthField
      ref={ref}
      icon={LockIcon}
      type={show ? "text" : "password"}
      className="pr-1"
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          className="mr-1.5 rounded-md p-2 text-[#5B6B88] transition-colors hover:text-[#071D4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645D8]/40"
        >
          {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      }
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ *
 * Requisitos reais da senha (espelham lib/validation/auth.ts)
 * ------------------------------------------------------------------ */
const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "Pelo menos 8 caracteres", test: (v) => v.length >= 8 },
  { label: "Uma letra minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Uma letra maiúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Um número", test: (v) => /\d/.test(v) },
  { label: "Um caractere especial", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordChecklist({ value }: { value: string }) {
  if (!value) return null;
  const passed = PASSWORD_RULES.filter((r) => r.test(value)).length;
  const segments = 4;
  const filled = Math.round((passed / PASSWORD_RULES.length) * segments);
  const barColor =
    passed <= 2
      ? "bg-[#D92D20]"
      : passed <= 4
        ? "bg-[#FFD500]"
        : "bg-[#23B64B]";

  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < filled ? barColor : "bg-[#E2E9F3]",
            )}
          />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-1.5 text-[12px]",
                ok ? "text-[#23B64B]" : "text-[#5B6B88]",
              )}
            >
              {ok ? (
                <Check className="size-3.5 shrink-0" />
              ) : (
                <span className="size-3.5 shrink-0 rounded-full border border-[#C6D2E4]" />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Alerta inline (erro / sucesso / aviso)
 * ------------------------------------------------------------------ */
const ALERT_STYLES = {
  error: {
    box: "border-[#FFCFC9] bg-[#FFF1F0] text-[#8A1B12]",
    icon: "text-[#D92D20]",
    Icon: CircleAlert,
  },
  success: {
    box: "border-[#B8E9C9] bg-[#EAF9EF] text-[#12622E]",
    icon: "text-[#23B64B]",
    Icon: CircleCheckBig,
  },
  warning: {
    box: "border-[#FBE1A8] bg-[#FFF7DB] text-[#7A5312]",
    icon: "text-[#B7791F]",
    Icon: TriangleAlert,
  },
} as const;

export function AuthAlert({
  variant = "error",
  children,
}: {
  variant?: keyof typeof ALERT_STYLES;
  children: React.ReactNode;
}) {
  const s = ALERT_STYLES[variant];
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-sm",
        s.box,
      )}
      role="alert"
      aria-live="polite"
    >
      <s.Icon className={cn("mt-0.5 size-4 shrink-0", s.icon)} />
      <div className="[&_a]:font-semibold [&_a]:underline">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Botão de envio — largura total, 50px, gradiente azul, com pending
 * ------------------------------------------------------------------ */
export function AuthSubmit({
  children,
  pendingText,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  pendingText: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[11px] bg-[linear-gradient(90deg,#0645D8,#0B55E8)] px-4 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(6,69,216,0.25)] transition-all hover:brightness-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645D8]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="size-4" />}
          {children}
        </>
      )}
    </button>
  );
}
