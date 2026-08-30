import type { Metadata } from "next";
import { Info } from "lucide-react";

import { getMyWalletBalance, getMyWalletStatement } from "@/lib/ledger/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  const cards = [
    {
      label: "Pendente",
      value: balance.pending_cents,
      hint: "Confirmado, em período de disponibilidade/risco.",
    },
    {
      label: "Disponível",
      value: balance.available_cents,
      hint: "Elegível para saque.",
    },
    {
      label: "Reservado",
      value: balance.reserved_cents,
      hint: "Retido por solicitações de saque abertas.",
    },
    {
      label: "Retido (risco)",
      value: balance.held_cents,
      hint: "Bloqueado por análise de risco.",
    },
    {
      label: "Sacado",
      value: balance.withdrawn_cents,
      hint: "Concluído via PIX Out.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Carteira</h1>
        <p className="text-muted-foreground">
          Seu saldo, atualizado automaticamente a cada doação confirmada.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {formatBRL(c.value)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert variant="info">
        <Info className="size-4" />
        <AlertDescription>
          Cada doação confirmada entra como <em>disponível</em> para saque. Ao
          solicitar um saque, o valor passa para <em>reservado</em> até o repasse
          ser concluído.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Extrato</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {statement.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem lançamentos ainda. Assim que uma doação for confirmada, ela
              aparece aqui.
            </p>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Data</th>
                  <th>Descrição</th>
                  <th>Conta</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {statement.map((l, i) => {
                  const signed =
                    l.direction === "credit" ? l.amount_cents : -l.amount_cents;
                  return (
                    <tr key={i}>
                      <td className="py-2 pr-2 text-muted-foreground">
                        {l.posted_at ? formatDateTimeBR(l.posted_at) : "—"}
                      </td>
                      <td className="pr-2">{l.description}</td>
                      <td className="pr-2 text-muted-foreground">
                        {ACCOUNT_LABEL[l.account_code] ?? l.account_code}
                      </td>
                      <td
                        className={`text-right tabular-nums ${
                          signed >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {signed >= 0 ? "+" : "−"}
                        {formatBRL(Math.abs(signed))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
