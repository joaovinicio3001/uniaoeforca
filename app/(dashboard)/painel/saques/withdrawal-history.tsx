"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";

import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  WithdrawalStatusBadge,
  WITHDRAWAL_STATUS_LABEL,
} from "@/components/withdrawals/status-badge";
import { CARD, EmptyState } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  requested_at: string;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  status: string;
  destination: string | null;
};

export function WithdrawalHistory({ rows }: { rows: Row[] }) {
  const [status, setStatus] = useState("all");

  const statuses = useMemo(() => {
    const set = new Set(rows.map((r) => r.status));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const filtered =
    status === "all" ? rows : rows.filter((r) => r.status === status);

  return (
    <section className={cn(CARD, "overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3FA] px-5 py-4">
        <h2 className="text-[17px] font-bold text-[#071D4A]">
          Histórico de saques
        </h2>
        {rows.length > 0 && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar por status"
            className="h-10 rounded-[10px] border border-[#DFE7F2] bg-white px-3 text-sm text-[#071D4A] outline-none focus:border-[#0645D8]"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "all"
                  ? "Todos os status"
                  : (WITHDRAWAL_STATUS_LABEL[
                      s as keyof typeof WITHDRAWAL_STATUS_LABEL
                    ] ?? s)}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={
            rows.length === 0
              ? "Você ainda não solicitou nenhum saque."
              : "Nenhum saque com esse status."
          }
          description={
            rows.length === 0 ? "Quando solicitar, ele aparecerá aqui." : undefined
          }
        />
      ) : (
        <>
          {/* Desktop */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-[#EEF3FA] text-left text-[13px] text-[#5B6B88]">
                <th className="px-5 py-3 font-semibold">Data da solicitação</th>
                <th className="px-3 py-3 font-semibold">Valor</th>
                <th className="px-3 py-3 font-semibold">Você recebe</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Destino</th>
                <th className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3FA]">
              {filtered.map((w) => (
                <tr key={w.id}>
                  <td className="px-5 py-4 text-[#5B6B88]">
                    {formatDateTimeBR(w.requested_at)}
                  </td>
                  <td className="px-3 py-4 tabular-nums text-[#071D4A]">
                    {formatBRL(w.amount_cents)}
                  </td>
                  <td className="px-3 py-4 font-semibold tabular-nums text-[#071D4A]">
                    {formatBRL(w.net_cents)}
                  </td>
                  <td className="px-3 py-4">
                    <WithdrawalStatusBadge
                      status={w.status as Parameters<typeof WithdrawalStatusBadge>[0]["status"]}
                    />
                  </td>
                  <td className="px-3 py-4 text-[#5B6B88]">
                    {w.destination ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/painel/saques/${w.id}`}
                      className="text-sm font-semibold text-[#0645D8] hover:underline"
                    >
                      Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <ul className="divide-y divide-[#EEF3FA] md:hidden">
            {filtered.map((w) => (
              <li key={w.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold tabular-nums text-[#071D4A]">
                      {formatBRL(w.amount_cents)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#5B6B88]">
                      {formatDateTimeBR(w.requested_at)}
                    </p>
                  </div>
                  <WithdrawalStatusBadge
                    status={w.status as Parameters<typeof WithdrawalStatusBadge>[0]["status"]}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[13px] text-[#5B6B88]">
                  <span>Você recebe {formatBRL(w.net_cents)}</span>
                  {w.destination && <span>{w.destination}</span>}
                </div>
                <Link
                  href={`/painel/saques/${w.id}`}
                  className="mt-2 inline-block text-[13px] font-semibold text-[#0645D8] hover:underline"
                >
                  Ver detalhes →
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
