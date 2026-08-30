import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { getMyWithdrawal } from "@/lib/withdrawals/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  WithdrawalStatusBadge,
  WITHDRAWAL_STATUS_LABEL,
} from "@/components/withdrawals/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cancelWithdrawalAction } from "../actions";
import { StatusPoller } from "./status-poller";

export const metadata: Metadata = { title: "Detalhe do saque" };

const STEPS = ["requested", "under_review", "approved", "processing", "paid"] as const;

export default async function SaqueDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const user = (await getSessionUser())!;
  const data = await getMyWithdrawal(id);
  if (!data || data.withdrawal.user_id !== user.id) notFound();

  const w = data.withdrawal;
  const snap = w.pix_key_snapshot as { masked?: string; type?: string } | null;
  const currentIdx = STEPS.indexOf(w.status as (typeof STEPS)[number]);
  const failed = ["rejected", "failed", "canceled"].includes(w.status);
  const canCancel = ["requested", "under_review"].includes(w.status);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <StatusPoller withdrawalId={id} initialStatus={w.status} />

      <Button asChild variant="ghost" size="sm">
        <Link href="/painel/saques">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Saque de {formatBRL(w.amount_cents)}</h1>
        <WithdrawalStatusBadge status={w.status} />
      </div>

      {erro === "nao-cancelavel" && (
        <Alert variant="warning">
          <AlertDescription>
            Este saque não pode mais ser cancelado.
          </AlertDescription>
        </Alert>
      )}
      {w.status === "rejected" && w.rejection_reason && (
        <Alert variant="warning">
          <AlertDescription>Rejeitado: {w.rejection_reason}</AlertDescription>
        </Alert>
      )}
      {w.status === "failed" && (
        <Alert variant="destructive">
          <AlertDescription>
            {w.failure_reason ?? "Falha no PIX Out."} O valor foi devolvido ao seu
            saldo disponível.
          </AlertDescription>
        </Alert>
      )}
      {w.status === "paid" && (
        <Alert variant="success">
          <AlertDescription>
            Pago! {formatBRL(w.net_cents)} enviados para a chave {snap?.masked}.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Info label="Valor solicitado" value={formatBRL(w.amount_cents)} />
          <Info label="Taxa de saque" value={formatBRL(w.fee_cents)} />
          <Info label="Você recebe" value={formatBRL(w.net_cents)} />
          <Info label="Chave PIX" value={snap?.masked ?? "—"} />
          <Info label="Solicitado em" value={formatDateTimeBR(w.requested_at)} />
          {w.paid_at && (
            <Info label="Pago em" value={formatDateTimeBR(w.paid_at)} />
          )}
        </CardContent>
      </Card>

      {!failed && (
        <Card>
          <CardHeader>
            <CardTitle>Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      i <= currentIdx
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < currentIdx ? "✓" : i + 1}
                  </span>
                  <span
                    className={
                      i <= currentIdx ? "font-medium" : "text-muted-foreground"
                    }
                  >
                    {WITHDRAWAL_STATUS_LABEL[s]}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {canCancel && (
        <form action={cancelWithdrawalAction}>
          <input type="hidden" name="withdrawalId" value={id} />
          <Button type="submit" variant="outline" size="sm">
            Cancelar solicitação
          </Button>
        </form>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
