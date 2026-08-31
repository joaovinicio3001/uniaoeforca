"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Monitor, RefreshCw, Smartphone } from "lucide-react";

import { revokeSessionAction } from "./actions";
import { CARD, EmptyState, StatusPill } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export type DeviceRow = {
  sessionId: string;
  device: string;
  isMobile: boolean;
  ipMasked: string;
  lastSeenAt: string | null;
  isCurrent: boolean;
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function RecentDevices({ devices }: { devices: DeviceRow[] }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [revoking, startRevoke] = useTransition();
  const [target, setTarget] = useState<DeviceRow | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTarget(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [target]);

  function confirmRevoke() {
    if (!target) return;
    const fd = new FormData();
    fd.set("sessionId", target.sessionId);
    startRevoke(async () => {
      const res = await revokeSessionAction(fd);
      setTarget(null);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <section className={cn(CARD, "overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3FA] px-5 py-4">
        <div>
          <h2 className="text-[17px] font-bold text-[#071D4A]">
            Dispositivos recentes
          </h2>
          <p className="mt-0.5 text-sm text-[#5B6B88]">
            Veja os dispositivos onde sua conta foi acessada recentemente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#DFE7F2] bg-white px-3.5 text-sm font-semibold text-[#17315C] transition-colors hover:bg-[#F5F8FE] disabled:opacity-60"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {devices.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="Nenhuma sessão ativa encontrada"
          description="Os acessos recentes da sua conta aparecerão aqui."
        />
      ) : (
        <>
          {/* Desktop */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-[#EEF3FA] text-left text-[13px] text-[#5B6B88]">
                <th className="px-5 py-3 font-semibold">Dispositivo</th>
                <th className="px-3 py-3 font-semibold">IP</th>
                <th className="px-3 py-3 font-semibold">Último acesso</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3FA]">
              {devices.map((d) => (
                <tr key={d.sessionId}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-[9px] bg-[#EDF4FF] text-[#0645D8]">
                        {d.isMobile ? (
                          <Smartphone className="size-4" />
                        ) : (
                          <Monitor className="size-4" />
                        )}
                      </span>
                      <div>
                        <p className="font-semibold text-[#071D4A]">{d.device}</p>
                        {d.isCurrent && (
                          <p className="text-[12px] text-[#5B6B88]">
                            Este dispositivo
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 tabular-nums text-[#5B6B88]">
                    {d.ipMasked}
                  </td>
                  <td className="px-3 py-4 text-[#5B6B88]">
                    {fmt(d.lastSeenAt)}
                  </td>
                  <td className="px-3 py-4">
                    {d.isCurrent ? (
                      <StatusPill tone="green">Ativo</StatusPill>
                    ) : (
                      <StatusPill tone="slate">Outra sessão</StatusPill>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {d.isCurrent ? (
                      <span className="text-[#9AA8BF]">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTarget(d)}
                        className="inline-flex h-9 items-center rounded-[9px] border border-[#E7A9A2] px-3 text-[13px] font-semibold text-[#D92D20] transition-colors hover:bg-[#FEECEA]"
                      >
                        Encerrar sessão
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <ul className="divide-y divide-[#EEF3FA] md:hidden">
            {devices.map((d) => (
              <li key={d.sessionId} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[#EDF4FF] text-[#0645D8]">
                    {d.isMobile ? (
                      <Smartphone className="size-4" />
                    ) : (
                      <Monitor className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#071D4A]">{d.device}</p>
                    {d.isCurrent && (
                      <p className="text-[12px] text-[#5B6B88]">Este dispositivo</p>
                    )}
                    <dl className="mt-2 space-y-1 text-[13px] text-[#5B6B88]">
                      <div className="flex justify-between gap-3">
                        <dt>IP</dt>
                        <dd className="tabular-nums">{d.ipMasked}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Último acesso</dt>
                        <dd>{fmt(d.lastSeenAt)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt>Status</dt>
                        <dd>
                          {d.isCurrent ? (
                            <StatusPill tone="green">Ativo</StatusPill>
                          ) : (
                            <StatusPill tone="slate">Outra sessão</StatusPill>
                          )}
                        </dd>
                      </div>
                    </dl>
                    {!d.isCurrent && (
                      <button
                        type="button"
                        onClick={() => setTarget(d)}
                        className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-[#E7A9A2] px-3 text-[13px] font-semibold text-[#D92D20] hover:bg-[#FEECEA]"
                      >
                        Encerrar sessão
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {target && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Encerrar sessão"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#071D4A]/45 p-4"
          onClick={(e) => e.target === e.currentTarget && setTarget(null)}
        >
          <div className="w-full max-w-md rounded-[16px] border border-[#DFE7F2] bg-white p-6 shadow-[0_24px_60px_rgba(7,29,74,0.28)]">
            <h3 className="text-[18px] font-bold text-[#071D4A]">
              Encerrar esta sessão?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6B88]">
              O dispositivo <strong>{target.device}</strong> será desconectado da
              sua conta e precisará entrar de novo.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setTarget(null)}
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#DFE7F2] bg-white px-4 text-sm font-semibold text-[#17315C] hover:bg-[#F5F8FE]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={confirmRevoke}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#D92D20] px-4 text-sm font-semibold text-white hover:bg-[#BE2318] disabled:opacity-60"
              >
                {revoking ? "Encerrando…" : "Encerrar sessão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
