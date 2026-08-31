import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Hourglass,
  Lock,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import { getMyWalletBalance, getMyWalletStatement } from "@/lib/ledger/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  CARD,
  InfoBanner,
  PageHeader,
  SectionCard,
  StatCard,
  btnPrimary,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Carteira" };

const ACCOUNT_LABEL: Record<string, string> = {
  CAMPAIGN_PENDING: "Pendente",
  CAMPAIGN_AVAILABLE: "Disponível",
  CAMPAIGN_RESERVED: "Reservado",
};

export default async function CarteiraPage() {
  const [balance, statement] = await Promise.all([
    getMyWalletBalance(),
    getMyWalletStatement(80),
  ]);

  const canWithdraw = balance.available_cents > 0;

  const subCards = [
    {
      icon: Hourglass,
      tone: "amber" as const,
      label: "Pendente",
      value: balance.pending_cents,
      hint: "Confirmado, no período de liberação.",
    },
    {
      icon: Lock,
      tone: "blue" as const,
      label: "Reservado",
      value: balance.reserved_cents,
      hint: "Ligado a pedidos de saque em aberto.",
    },
    {
      icon: ShieldAlert,
      tone: "slate" as const,
      label: "Retido",
      value: balance.held_cents,
      hint: "Temporariamente indisponível.",
    },
    {
      icon: Banknote,
      tone: "purple" as const,
      label: "Sacado",
      value: balance.withdrawn_cents,
      hint: "Valores já repassados via PIX.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carteira"
        subtitle="Seu saldo, atualizado automaticamente a cada doação confirmada."
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_2fr]">
        {/* Saldo disponível — destaque */}
        <div className={cn(CARD, "flex flex-col justify-between gap-5 p-6")}>
          <div>
            <div className="flex items-center gap-2 text-[#5B6B88]">
              <Wallet className="size-[18px] text-[#20B85A]" />
              <span className="text-sm font-medium">Saldo disponível</span>
            </div>
            <p className="mt-2 text-[32px] font-bold leading-none text-[#20B85A]">
              {formatBRL(balance.available_cents)}
            </p>
            <p className="mt-2 text-[13px] text-[#5B6B88]">
              Elegível para saque.
            </p>
          </div>
          {canWithdraw ? (
            <Link
              href="/painel/saques/nova"
              className={cn(btnPrimary, "w-full bg-[#20B85A] hover:bg-[#1AA150] shadow-[0_8px_20px_rgba(32,184,90,0.25)]")}
            >
              Solicitar saque <ArrowRight className="size-4" />
            </Link>
          ) : (
            <p className="rounded-[11px] bg-[#F7FAFD] px-4 py-3 text-center text-[13px] text-[#5B6B88]">
              Você poderá solicitar um saque quando tiver saldo disponível.
            </p>
          )}
        </div>

        {/* Demais saldos */}
        <div className="grid gap-4 sm:grid-cols-2">
          {subCards.map((c) => (
            <StatCard
              key={c.label}
              icon={c.icon}
              tone={c.tone}
              label={c.label}
              value={formatBRL(c.value)}
              hint={c.hint}
            />
          ))}
        </div>
      </div>

      <InfoBanner>
        Cada doação confirmada entra como <strong>disponível</strong> para saque.
        Ao pedir um saque, o valor passa para <strong>reservado</strong> até o
        repasse ser concluído e então vira <strong>sacado</strong>.
      </InfoBanner>

      <SectionCard title="Extrato" bodyClassName="p-0">
        {statement.length === 0 ? (
          <p className="p-6 text-sm text-[#5B6B88]">
            Sem lançamentos ainda. Assim que uma doação for confirmada, ela
            aparece aqui.
          </p>
        ) : (
          <>
            {/* Desktop */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-[#EEF3FA] text-left text-[13px] text-[#5B6B88]">
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-3 py-3 font-semibold">Descrição</th>
                  <th className="px-3 py-3 font-semibold">Conta</th>
                  <th className="px-5 py-3 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3FA]">
                {statement.map((l, i) => {
                  const signed =
                    l.direction === "credit" ? l.amount_cents : -l.amount_cents;
                  return (
                    <tr key={i}>
                      <td className="px-5 py-3.5 text-[#5B6B88]">
                        {l.posted_at ? formatDateTimeBR(l.posted_at) : "—"}
                      </td>
                      <td className="px-3 py-3.5 text-[#071D4A]">
                        {l.description}
                      </td>
                      <td className="px-3 py-3.5 text-[#5B6B88]">
                        {ACCOUNT_LABEL[l.account_code] ?? l.account_code}
                      </td>
                      <td
                        className={cn(
                          "px-5 py-3.5 text-right font-semibold tabular-nums",
                          signed >= 0 ? "text-[#20B85A]" : "text-[#D92D20]",
                        )}
                      >
                        {signed >= 0 ? "+" : "−"}
                        {formatBRL(Math.abs(signed))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile */}
            <ul className="divide-y divide-[#EEF3FA] md:hidden">
              {statement.map((l, i) => {
                const signed =
                  l.direction === "credit" ? l.amount_cents : -l.amount_cents;
                return (
                  <li key={i} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-medium text-[#071D4A]">{l.description}</p>
                      <p className="mt-0.5 text-[13px] text-[#5B6B88]">
                        {l.posted_at ? formatDateTimeBR(l.posted_at) : "—"} ·{" "}
                        {ACCOUNT_LABEL[l.account_code] ?? l.account_code}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-semibold tabular-nums",
                        signed >= 0 ? "text-[#20B85A]" : "text-[#D92D20]",
                      )}
                    >
                      {signed >= 0 ? "+" : "−"}
                      {formatBRL(Math.abs(signed))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </SectionCard>
    </div>
  );
}
