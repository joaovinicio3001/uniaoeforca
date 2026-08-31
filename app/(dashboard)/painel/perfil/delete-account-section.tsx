"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { requestAccountDeletionAction } from "../privacidade/actions";
import { CARD } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export function DeleteAccountSection({ pending }: { pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, start] = useTransition();
  const [done, setDone] = useState(pending);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function submit() {
    start(async () => {
      const r = await requestAccountDeletionAction();
      setOpen(false);
      setConfirmText("");
      if (r.ok) {
        setDone(true);
        toast.success(r.message);
      } else {
        toast.error(r.message);
      }
    });
  }

  return (
    <section
      className={cn(
        CARD,
        "flex flex-col gap-4 border-[#F6D2CE] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
      )}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FEECEA] text-[#D92D20]">
          <Trash2 className="size-5" />
        </span>
        <div>
          <h2 className="text-[17px] font-bold text-[#D92D20]">Excluir conta</h2>
          <p className="mt-1 text-sm text-[#5B6B88]">
            Excluir sua conta é uma ação permanente e não pode ser desfeita.
          </p>
        </div>
      </div>

      {done ? (
        <span className="shrink-0 rounded-[10px] bg-[#FFF8DF] px-4 py-2 text-sm font-medium text-[#7A5312]">
          Solicitação de exclusão em andamento
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[11px] border border-[#E7A9A2] px-4 text-sm font-semibold text-[#D92D20] transition-colors hover:bg-[#FEECEA]"
        >
          Excluir minha conta
        </button>
      )}

      {open && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Excluir sua conta"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#071D4A]/45 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-[16px] border border-[#DFE7F2] bg-white p-6 shadow-[0_24px_60px_rgba(7,29,74,0.28)]">
            <h3 className="text-[18px] font-bold text-[#071D4A]">
              Excluir sua conta?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6B88]">
              Sua solicitação será registrada e nossa equipe conclui a
              exclusão/anonimização em até 15 dias, respeitando os prazos legais
              de retenção de dados financeiros. Depois disso, você perde o acesso
              à plataforma.
            </p>

            <label
              htmlFor="confirm-delete"
              className="mt-5 block text-sm font-semibold text-[#071D4A]"
            >
              Digite <span className="font-mono text-[#D92D20]">EXCLUIR</span>{" "}
              para confirmar
            </label>
            <input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="mt-1.5 h-11 w-full rounded-[11px] border border-[#DFE7F2] bg-white px-3.5 text-[16px] text-[#071D4A] outline-none focus:border-[#D92D20] focus:shadow-[0_0_0_3px_rgba(217,45,32,0.10)]"
            />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#DFE7F2] bg-white px-4 text-sm font-semibold text-[#17315C] hover:bg-[#F5F8FE]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmText.trim().toUpperCase() !== "EXCLUIR" || isPending}
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
