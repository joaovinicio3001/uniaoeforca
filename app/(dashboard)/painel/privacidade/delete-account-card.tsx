"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TriangleAlert, Trash2 } from "lucide-react";

import { requestAccountDeletionWithPasswordAction } from "./actions";
import { AuthPasswordField } from "@/components/auth/auth-form-kit";
import { CARD } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const WARNINGS = [
  "Esta ação não pode ser desfeita.",
  "Você perde o acesso à conta.",
  "Suas campanhas e contribuições ficam indisponíveis.",
  "Registros financeiros podem ser mantidos de forma anônima conforme exigido por lei.",
];

export function DeleteAccountCard({ pending }: { pending: boolean }) {
  const [done, setDone] = useState(pending);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    setPassword("");
    setError(null);
  }

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("password", password);
    start(async () => {
      const r = await requestAccountDeletionWithPasswordAction(null, fd);
      if (r.ok) {
        close();
        setDone(true);
        toast.success("Sua solicitação de exclusão foi recebida.");
      } else {
        setError(r.message);
        if (r.blocked) toast.error(r.message);
      }
    });
  }

  return (
    <section
      className={cn(CARD, "border-[#F3D3CE] p-5 sm:p-6")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#FEECEA] text-[#D92D20]">
            <Trash2 className="size-7" />
          </span>
          <div>
            <h2 className="text-[18px] font-bold text-[#D92D20]">
              Excluir minha conta
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#5B6B88]">
              Ao solicitar a exclusão, seus dados pessoais são removidos ou
              anonimizados. Alguns registros financeiros podem precisar ser
              mantidos de forma anônima para cumprir obrigações legais.
            </p>
          </div>
        </div>

        {done ? (
          <span className="shrink-0 rounded-[10px] bg-[#FFF8DF] px-4 py-2.5 text-sm font-medium text-[#7A5312] max-sm:w-full max-sm:text-center">
            Solicitação de exclusão em andamento
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[11px] border border-[#E7A9A2] px-4 text-sm font-semibold text-[#D92D20] transition-colors hover:bg-[#FEECEA] max-sm:w-full"
          >
            <Trash2 className="size-4" /> Solicitar exclusão da conta
          </button>
        )}
      </div>

      <div className="mt-5 rounded-[12px] border border-[#F3D3CE] bg-[#FFF5F4] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#8A1B12]">
          <TriangleAlert className="size-4 text-[#D92D20]" /> Antes de excluir,
          saiba que:
        </p>
        <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-[#8A1B12]">
          {WARNINGS.map((w) => (
            <li key={w} className="flex gap-2">
              <span aria-hidden>•</span>
              {w}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[13px] text-[#5B6B88]">
        Saiba mais sobre a exclusão e a retenção de dados na{" "}
        <Link href="/privacidade" className="font-medium text-[#0645D8] hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>

      {open && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Excluir sua conta"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#071D4A]/45 p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[16px] border border-[#DFE7F2] bg-white p-6 shadow-[0_24px_60px_rgba(7,29,74,0.28)]">
            <h3 className="text-[18px] font-bold text-[#071D4A]">
              Excluir sua conta?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6B88]">
              Antes de continuar, confirme que você entende as consequências:
            </p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-[#43536F]">
              {WARNINGS.map((w) => (
                <li key={w} className="flex gap-2">
                  <span aria-hidden className="text-[#D92D20]">
                    •
                  </span>
                  {w}
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <AuthPasswordField
                id="delete-password"
                name="password"
                label="Digite sua senha para confirmar"
                autoComplete="current-password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error ?? undefined}
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={close}
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#DFE7F2] bg-white px-4 text-sm font-semibold text-[#17315C] hover:bg-[#F5F8FE]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending || password.length === 0}
                onClick={submit}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#D92D20] px-4 text-sm font-semibold text-white hover:bg-[#BE2318] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Enviando…" : "Continuar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
