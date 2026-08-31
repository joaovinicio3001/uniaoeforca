import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Plus, Wallet } from "lucide-react";

import { listMyWithdrawals } from "@/lib/withdrawals/queries";
import { finalizeProcessingPayouts } from "@/lib/withdrawals/service";
import { getMyWalletBalance } from "@/lib/ledger/queries";
import { formatBRL } from "@/lib/utils";
import {
  CARD,
  DashLinkButton,
  PageHeader,
  btnPrimary,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { WithdrawalHistory } from "./withdrawal-history";

export const metadata: Metadata = { title: "Saques" };

export default async function SaquesPage() {
  let withdrawals = await listMyWithdrawals();

  // Se algum saque está "processando", reconfirma no provedor antes de renderizar
  // — assim o usuário vê "Pago" assim que o PIX Out conclui.
  if (withdrawals[0] && withdrawals.some((w) => w.status === "processing")) {
    await finalizeProcessingPayouts({ userId: withdrawals[0].user_id });
    withdrawals = await listMyWithdrawals();
  }

  const balance = await getMyWalletBalance();
  const canWithdraw = balance.available_cents > 0;

  const rows = withdrawals.map((w) => {
    const snap = w.pix_key_snapshot as { masked?: string } | null;
    return {
      id: w.id,
      requested_at: w.requested_at,
      amount_cents: w.amount_cents,
      fee_cents: w.fee_cents,
      net_cents: w.net_cents,
      status: w.status,
      destination: snap?.masked ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saques"
        subtitle="Gerencie seus saques e acompanhe o status das suas solicitações."
        actions={
          <>
            <DashLinkButton href="/painel/saques/chaves" variant="secondary">
              <KeyRound className="size-4" /> Chaves PIX
            </DashLinkButton>
            {canWithdraw ? (
              <DashLinkButton href="/painel/saques/nova">
                <Plus className="size-4" /> Solicitar saque
              </DashLinkButton>
            ) : (
              <span className={cn(btnPrimary, "pointer-events-none opacity-50")}>
                <Plus className="size-4" /> Solicitar saque
              </span>
            )}
          </>
        }
      />

      <div className={cn(CARD, "flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between")}>
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#ECF9F0] text-[#20B85A]">
            <Wallet className="size-7" />
          </span>
          <div>
            <p className="text-sm font-medium text-[#5B6B88]">
              Saldo disponível para saque
            </p>
            <p className="mt-1 text-[30px] font-bold leading-none text-[#20B85A]">
              {formatBRL(balance.available_cents)}
            </p>
            <p className="mt-1.5 text-[13px] text-[#5B6B88]">
              {canWithdraw
                ? "Esse é o valor que você pode solicitar para saque agora."
                : "Você ainda não tem saldo disponível para saque."}
            </p>
          </div>
        </div>
        {canWithdraw && (
          <Link href="/painel/saques/nova" className={cn(btnPrimary, "shrink-0")}>
            <Plus className="size-4" /> Solicitar saque
          </Link>
        )}
      </div>

      <WithdrawalHistory rows={rows} />
    </div>
  );
}
