"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, HandHeart, Search } from "lucide-react";

import { formatBRL } from "@/lib/utils";
import { CARD, EmptyState, StatusPill } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export type ContributionRow = {
  id: string;
  gross_amount_cents: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  campaignSlug: string | null;
  campaignTitle: string;
  campaignSummary: string | null;
  coverUrl: string | null;
  payUrl: string | null;
};

const STATUS_META: Record<
  string,
  { label: string; tone: "green" | "amber" | "slate" | "red" }
> = {
  created: { label: "Iniciada", tone: "slate" },
  pending: { label: "Aguardando pagamento", tone: "amber" },
  paid: { label: "Confirmada", tone: "green" },
  failed: { label: "Falhou", tone: "red" },
  expired: { label: "Expirada", tone: "slate" },
  refunded: { label: "Estornada", tone: "slate" },
  chargeback: { label: "Contestada", tone: "red" },
};

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}
function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function ContributionsView({ rows }: { rows: ContributionRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const statuses = useMemo(() => {
    const set = new Set(rows.map((r) => r.status));
    return ["all", ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (needle && !r.campaignTitle.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, q, status]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center rounded-[11px] border border-[#DFE7F2] bg-white focus-within:border-[#0645D8] focus-within:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]">
          <Search className="ml-3.5 size-4 shrink-0 text-[#5B6B88]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por campanha"
            aria-label="Buscar por campanha"
            className="h-11 w-full min-w-0 rounded-[11px] bg-transparent px-3 text-[15px] text-[#071D4A] outline-none placeholder:text-[#9AA8BF]"
          />
        </div>
        <label className="flex items-center gap-2">
          <span className="sr-only">Filtrar por status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-[11px] border border-[#DFE7F2] bg-white px-3 text-[15px] text-[#071D4A] outline-none focus:border-[#0645D8]"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os status" : (STATUS_META[s]?.label ?? s)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={cn(CARD, "overflow-hidden")}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title="Nenhuma contribuição encontrada"
            description={
              rows.length === 0
                ? "Quando você apoiar uma campanha, o registro aparece aqui."
                : "Tente ajustar a busca ou o filtro de status."
            }
            action={
              rows.length === 0 ? (
                <Link
                  href="/campanhas"
                  className="text-sm font-semibold text-[#0645D8] hover:underline"
                >
                  Explorar campanhas
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-[#EEF3FA] text-left text-[13px] text-[#5B6B88]">
                  <th className="px-5 py-3 font-semibold">Campanha</th>
                  <th className="px-3 py-3 font-semibold">Data</th>
                  <th className="px-3 py-3 font-semibold">Valor</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3FA]">
                {filtered.map((r) => {
                  const meta = STATUS_META[r.status] ?? {
                    label: r.status,
                    tone: "slate" as const,
                  };
                  return (
                    <tr key={r.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Thumb url={r.coverUrl} />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#071D4A]">
                              {r.campaignTitle}
                            </p>
                            {r.campaignSummary && (
                              <p className="line-clamp-1 text-[13px] text-[#5B6B88]">
                                {r.campaignSummary}
                              </p>
                            )}
                            {r.campaignSlug && (
                              <Link
                                href={`/campanhas/${r.campaignSlug}`}
                                className="text-[13px] font-medium text-[#0645D8] hover:underline"
                              >
                                Ver campanha →
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[#5B6B88]">
                        <div>{fmtDate(r.created_at)}</div>
                        <div className="text-[13px]">{fmtTime(r.created_at)}</div>
                      </td>
                      <td className="px-3 py-4">
                        <span className="font-bold text-[#20B85A]">
                          {formatBRL(r.gross_amount_cents)}
                        </span>
                        <div className="text-[13px] text-[#5B6B88]">via PIX</div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                        {r.status === "pending" && r.payUrl && (
                          <div className="mt-1">
                            <Link
                              href={r.payUrl}
                              className="text-[13px] font-medium text-[#0645D8] hover:underline"
                            >
                              Concluir pagamento
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile */}
            <ul className="divide-y divide-[#EEF3FA] md:hidden">
              {filtered.map((r) => {
                const meta = STATUS_META[r.status] ?? {
                  label: r.status,
                  tone: "slate" as const,
                };
                return (
                  <li key={r.id} className="p-4">
                    <div className="flex gap-3">
                      <Thumb url={r.coverUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#071D4A]">
                          {r.campaignTitle}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-[13px] text-[#5B6B88]">
                          <CalendarDays className="size-3.5" />
                          {fmtDate(r.created_at)}
                          <Clock className="size-3.5" />
                          {fmtTime(r.created_at)}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-bold text-[#20B85A]">
                            {formatBRL(r.gross_amount_cents)}
                          </span>
                          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                        </div>
                        {r.status === "pending" && r.payUrl && (
                          <Link
                            href={r.payUrl}
                            className="mt-2 inline-block text-[13px] font-medium text-[#0645D8] hover:underline"
                          >
                            Concluir pagamento →
                          </Link>
                        )}
                        {r.status !== "pending" && r.campaignSlug && (
                          <Link
                            href={`/campanhas/${r.campaignSlug}`}
                            className="mt-2 inline-block text-[13px] font-medium text-[#0645D8] hover:underline"
                          >
                            Ver campanha →
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-center text-[13px] text-[#5B6B88]">
          Mostrando {filtered.length} de {rows.length}{" "}
          {rows.length === 1 ? "contribuição" : "contribuições"}
        </p>
      )}
    </div>
  );
}

function Thumb({ url }: { url: string | null }) {
  return (
    <span className="relative block size-12 shrink-0 overflow-hidden rounded-[10px] bg-[#EEF3FA]">
      {url ? (
        <Image src={url} alt="" fill sizes="48px" className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-[#9AA8BF]">
          <HandHeart className="size-5" />
        </span>
      )}
    </span>
  );
}
