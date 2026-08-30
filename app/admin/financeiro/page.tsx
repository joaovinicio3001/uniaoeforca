import type { Metadata } from "next";
import { CheckCircle2, AlertTriangle } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getTrialBalance } from "@/lib/ledger/queries";
import { formatBRL } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Financeiro / Ledger" };

const ACCOUNT_LABEL: Record<string, string> = {
  CASH_PROVIDER_IN: "Caixa — provedor de entrada",
  CASH_PIXOUT: "Caixa — PIX Out",
  PLATFORM_REVENUE: "Receita da plataforma",
  PROVIDER_FEES: "Custos de provedor (acúmulo)",
  REFUND_RESERVE: "Reserva de devoluções",
  WITHDRAWAL_PAYABLE: "Saques a pagar",
  CAMPAIGN_PENDING: "Saldo pendente (carteiras)",
  CAMPAIGN_AVAILABLE: "Saldo disponível (carteiras)",
  CAMPAIGN_RESERVED: "Saldo reservado (carteiras)",
};

export default async function AdminFinanceiroPage() {
  const user = await requireStaff();
  if (!can(user.roles, "ledger:read")) {
    return <p className="text-sm text-muted-foreground">Sem permissão.</p>;
  }

  const tb = await getTrialBalance();

  if (!tb) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Financeiro / Ledger</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code> para carregar o balancete.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { summary, imbalanced } = tb;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro / Ledger</h1>

      {summary.balanced && imbalanced.length === 0 ? (
        <Alert variant="success">
          <CheckCircle2 className="size-4" />
          <AlertTitle>Ledger fecha em zero</AlertTitle>
          <AlertDescription>
            A soma de todos os lançamentos é <strong>0</strong> e nenhuma transação
            está desbalanceada. Cada centavo reconciliável (doc §27/§28).
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Divergência no ledger</AlertTitle>
          <AlertDescription>
            Soma global: {formatBRL(summary.total)}. Transações desbalanceadas:{" "}
            {imbalanced.length}. Investigar imediatamente.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Balancete por conta</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-2">Conta</th>
                <th className="text-right">Saldo (sinal contábil)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summary.byCode.map((r) => (
                <tr key={r.code}>
                  <td className="py-2 pr-2">
                    {ACCOUNT_LABEL[r.code] ?? r.code}
                  </td>
                  <td className="text-right tabular-nums">
                    {formatBRL(r.signed_cents)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 font-semibold">
                <td className="py-2">Soma global (deve ser 0)</td>
                <td className="text-right tabular-nums">
                  {formatBRL(summary.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <strong>PROVIDER_FEES</strong> é conta de acúmulo (crédito) contra{" "}
        <strong>CASH_PROVIDER_IN</strong>: a estimativa entra agora e é acertada
        com o extrato real na conciliação (Fase 6). Saques e{" "}
        <strong>CASH_PIXOUT</strong>/<strong>WITHDRAWAL_PAYABLE</strong> passam a se
        mover na Fase 4.
      </p>
    </div>
  );
}
