"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

import { logoutOtherSessionsAction } from "./actions";
import { CARD } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export function AccountSessionsCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function confirm() {
    start(async () => {
      const res = await logoutOtherSessionsAction();
      setOpen(false);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <section
      className={cn(
        CARD,
        "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
      )}
    >
      <div>
        <h2 className="text-[17px] font-bold text-[#071D4A]">Sessão da conta</h2>
        <p className="mt-1 text-sm text-[#5B6B88]">
          Se você suspeitar de acesso indevido, encerre suas outras sessões.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[11px] border border-[#E7A9A2] px-4 text-sm font-semibold text-[#D92D20] transition-colors hover:bg-[#FEECEA] max-sm:w-full"
      >
        <LogOut className="size-4" /> Sair de outros dispositivos
      </button>

      {open && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Sair de outros dispositivos"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#071D4A]/45 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-[16px] border border-[#DFE7F2] bg-white p-6 shadow-[0_24px_60px_rgba(7,29,74,0.28)]">
            <h3 className="text-[18px] font-bold text-[#071D4A]">
              Sair de outros dispositivos?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6B88]">
              Todas as outras sessões da sua conta serão encerradas. Este
              dispositivo continuará conectado.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#DFE7F2] bg-white px-4 text-sm font-semibold text-[#17315C] hover:bg-[#F5F8FE]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirm}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#D92D20] px-4 text-sm font-semibold text-white hover:bg-[#BE2318] disabled:opacity-60"
              >
                {pending ? "Encerrando…" : "Sair de outros dispositivos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
