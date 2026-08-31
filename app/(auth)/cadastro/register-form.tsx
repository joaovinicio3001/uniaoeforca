"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IdCard,
  Mail,
  MessageCircle,
  UserRound,
  UserRoundPlus,
} from "lucide-react";

import { registerAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSubmit,
  PasswordChecklist,
} from "@/components/auth/auth-form-kit";
import { formatCPF } from "@/lib/validation/cpf";

/** Máscara de exibição do WhatsApp — o backend só usa os dígitos. */
function formatPhoneBR(value: string): string {
  const d = value.replace(/\D+/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialFormState);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fields, setFields] = useState({
    fullName: "",
    cpf: "",
    email: "",
    whatsapp: "",
  });

  // Devolve ao formulário o que a pessoa digitou quando o cadastro dá erro.
  useEffect(() => {
    const v = state.values;
    if (!v) return;
    setFields((f) => ({
      ...f,
      fullName: v.fullName ?? f.fullName,
      email: v.email ?? f.email,
      cpf: v.cpf ? formatCPF(v.cpf) : f.cpf,
      whatsapp: v.whatsapp ? formatPhoneBR(v.whatsapp) : f.whatsapp,
    }));
  }, [state.values]);

  const set =
    (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setFields((f) => ({
        ...f,
        [key]:
          key === "cpf"
            ? formatCPF(raw)
            : key === "whatsapp"
              ? formatPhoneBR(raw)
              : raw,
      }));
    };

  const mismatch = useMemo(
    () => confirm.length > 0 && password.length > 0 && confirm !== password,
    [confirm, password],
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.duplicate && (
        <AuthAlert variant="warning">
          {state.message}{" "}
          <Link href="/login">Entrar</Link> ·{" "}
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
        </AuthAlert>
      )}

      {state.status === "error" && !state.duplicate && state.message && (
        <AuthAlert variant="error">{state.message}</AuthAlert>
      )}

      <AuthField
        id="fullName"
        name="fullName"
        label="Nome completo"
        icon={UserRound}
        autoComplete="name"
        placeholder="Digite seu nome completo"
        required
        value={fields.fullName}
        onChange={set("fullName")}
        error={state.fieldErrors?.fullName?.[0]}
      />

      <AuthField
        id="cpf"
        name="cpf"
        label="CPF"
        icon={IdCard}
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        required
        value={fields.cpf}
        onChange={set("cpf")}
        error={state.fieldErrors?.cpf?.[0]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          id="email"
          name="email"
          label="E-mail"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          required
          value={fields.email}
          onChange={set("email")}
          error={state.fieldErrors?.email?.[0]}
        />
        <AuthField
          id="whatsapp"
          name="whatsapp"
          label="WhatsApp"
          icon={MessageCircle}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          required
          value={fields.whatsapp}
          onChange={set("whatsapp")}
          error={state.fieldErrors?.whatsapp?.[0]}
        />
      </div>

      <div>
        <AuthPasswordField
          id="password"
          name="password"
          label="Senha"
          autoComplete="new-password"
          placeholder="Digite sua senha"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={state.fieldErrors?.password?.[0]}
        />
        <PasswordChecklist value={password} />
      </div>

      <AuthPasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar senha"
        autoComplete="new-password"
        placeholder="Confirme sua senha"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={
          state.fieldErrors?.confirmPassword?.[0] ??
          (mismatch ? "As senhas não coincidem." : undefined)
        }
      />

      <label className="flex items-start gap-2.5 text-sm text-[#5B6B88]">
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="mt-0.5 size-4 shrink-0 rounded border-[#C6D2E4] text-[#0645D8] focus-visible:ring-[#0645D8]/40"
        />
        <span>
          Tenho 18 anos ou mais e aceito os{" "}
          <Link
            href="/termos"
            className="font-medium text-[#0645D8] hover:underline"
          >
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            className="font-medium text-[#0645D8] hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      {state.fieldErrors?.acceptTerms?.[0] && (
        <p className="text-[12px] font-medium text-[#D92D20]" role="alert">
          {state.fieldErrors.acceptTerms[0]}
        </p>
      )}

      <label className="flex items-start gap-2.5 text-sm text-[#5B6B88]">
        <input
          type="checkbox"
          name="marketingOptIn"
          className="mt-0.5 size-4 shrink-0 rounded border-[#C6D2E4] text-[#0645D8] focus-visible:ring-[#0645D8]/40"
        />
        <span>Quero receber novidades e dicas por e-mail (opcional).</span>
      </label>

      <AuthSubmit pendingText="Criando conta…" icon={UserRoundPlus}>
        Criar conta
      </AuthSubmit>

      <p className="pt-1 text-center text-sm text-[#5B6B88]">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#0645D8] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
