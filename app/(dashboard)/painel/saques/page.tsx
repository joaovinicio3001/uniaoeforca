import type { Metadata } from "next";
import Link from "next/link";
import { Plus, KeyRound } from "lucide-react";

import { listMyWithdrawals } from "@/lib/withdrawals/queries";
import { getMyWalletBalance } from "@/lib/ledger/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WithdrawalStatusBadge } from "@/components/withdrawals/status-badge";

export const metadata: Metadata = { title: "Saques" };

export default async function SaquesPage() {
  const [withdrawals, balance] = await Promise.all([
    listMyWithdrawals(),
    getMyWalletBalance(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Saques</h1>
          <p className="text-muted-foreground">
            Saldo disponível para saque:{" "}
            <strong className="text-foreground">
              {formatBRL(balance.available_cents)}
            </strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/painel/saques/chaves">
              <KeyRound className="size-4" /> Chaves PIX
            </Link>
          </Button>
          <Button asChild size="sm" disabled={balance.available_cents <= 0}>
            <Link href="/painel/saques/nova">
              <Plus className="size-4" /> Solicitar saque
            </Link>
          </Button>
        </div>
      </div>

      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Você ainda não solicitou nenhum saque.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="p-3">Solicitado</th>
                  <th>Valor</th>
                  <th>Taxa</th>
                  <th>Líquido</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="p-3 text-muted-foreground">
                      {formatDateTimeBR(w.requested_at)}
                    </td>
                    <td className="tabular-nums">{formatBRL(w.amount_cents)}</td>
                    <td className="tabular-nums text-muted-foreground">
                      {formatBRL(w.fee_cents)}
                    </td>
                    <td className="tabular-nums font-medium">
                      {formatBRL(w.net_cents)}
                    </td>
                    <td>
                      <WithdrawalStatusBadge status={w.status} />
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/painel/saques/${w.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
