import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getPixOutProvider } from "@/lib/payments/pixout";
import { getWithdrawalForReview } from "@/lib/withdrawals/queries";
import { listRiskFlagsForWithdrawal } from "@/lib/risk/service";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WithdrawalStatusBadge } from "@/components/withdrawals/status-badge";
import {
  startReviewAction,
  approveWithdrawalAction,
  rejectWithdrawalAction,
  checkPayoutStatusAction,
  retryPayoutAction,
  simulatePayoutAction,
} from "../actions";

export const metadata: Metadata = { title: "Revisar saque" };

export default async function AdminSaqueReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const [data, riskFlags] = await Promise.all([
    getWithdrawalForReview(id),
    listRiskFlagsForWithdrawal(id),
  ]);
  if (!data) notFound();

  const { withdrawal: w, profile, payout, events, balance } = data;
  const snap = w.pix_key_snapshot as {
    masked?: string;
    type?: string;
    owner_name?: string | null;
  } | null;
  const canApprove = can(user.roles, "withdrawal:approve");
  const isMock = getPixOutProvider().isMock;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/saques">
          <ArrowLeft className="size-4" /> Fila
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">Saque de {formatBRL(w.amount_cents)}</h1>
        <WithdrawalStatusBadge status={w.status} />
      </div>

      {ok === "primeira-aprovacao" && (
        <Alert variant="warning">
          <AlertDescription>
            Primeira aprovação registrada. Este saque é de alto valor e precisa de
            uma segunda aprovação, feita por outro analista.
          </AlertDescription>
        </Alert>
      )}
      {ok && ok !== "primeira-aprovacao" && (
        <Alert variant="success">
          <AlertDescription>Ação registrada ({ok}).</AlertDescription>
        </Alert>
      )}

      {riskFlags.length > 0 && (
        <Alert variant={riskFlags.some((f) => f.severity === "critical") ? "destructive" : "warning"}>
          <AlertDescription>
            <strong>{riskFlags.length} sinal(is) de risco</strong>:{" "}
            {riskFlags.map((f) => `${f.type} (${f.severity})`).join(", ")}. Revise
            em <Link href="/admin/risco" className="underline">Risco</Link> antes de aprovar.
          </AlertDescription>
        </Alert>
      )}
      {w.first_approved_by && w.status === "under_review" && (
        <Alert variant="info">
          <AlertDescription>
            Aguardando a segunda aprovação (a primeira já foi registrada).
          </AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>
            {erro === "motivo-obrigatorio"
              ? "Informe um motivo (mín. 5 caracteres)."
              : decodeURIComponent(erro)}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identidade e saldo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Info label="Beneficiário" value={profile?.full_name ?? "—"} />
          <Info
            label="CPF"
            value={profile?.cpf_last3 ? `•••.${profile.cpf_last3}` : "—"}
          />
          <Info label="Status da conta" value={profile?.status ?? "—"} />
          <Info
            label="Chave PIX"
            value={`${snap?.type ?? ""} ${snap?.masked ?? "—"}`}
          />
          <Info label="Titular da chave" value={snap?.owner_name ?? "—"} />
          <Info
            label="Saldo disp. / reservado"
            value={`${formatBRL(balance?.available_cents ?? 0)} / ${formatBRL(
              balance?.reserved_cents ?? 0,
            )}`}
          />
          <Info label="Valor / taxa / líquido" value={`${formatBRL(w.amount_cents)} · ${formatBRL(w.fee_cents)} · ${formatBRL(w.net_cents)}`} />
          <Info label="Solicitado" value={formatDateTimeBR(w.requested_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {w.status === "requested" && (
            <form action={startReviewAction}>
              <input type="hidden" name="withdrawalId" value={id} />
              <Button type="submit" variant="outline" size="sm">
                Iniciar análise
              </Button>
            </form>
          )}

          {["requested", "under_review"].includes(w.status) && (
            <>
              {canApprove ? (
                <form action={approveWithdrawalAction}>
                  <input type="hidden" name="withdrawalId" value={id} />
                  <Button type="submit" variant="success" size="sm">
                    Aprovar e enviar PIX Out
                  </Button>
                </form>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aprovação exige alçada de <strong>financeiro</strong>.
                </p>
              )}
              <form action={rejectWithdrawalAction} className="space-y-2">
                <input type="hidden" name="withdrawalId" value={id} />
                <textarea
                  name="reason"
                  required
                  rows={2}
                  placeholder="Motivo da rejeição (visível ao usuário)"
                  className="w-full rounded-md border border-input bg-card p-2 text-sm"
                />
                <Button type="submit" variant="destructive" size="sm">
                  Rejeitar
                </Button>
              </form>
            </>
          )}

          {w.status === "processing" && (
            <>
              <form action={checkPayoutStatusAction}>
                <input type="hidden" name="withdrawalId" value={id} />
                <Button type="submit" variant="outline" size="sm">
                  Consultar status no provedor
                </Button>
              </form>
              {isMock && (
                <div className="flex gap-2">
                  <form action={simulatePayoutAction}>
                    <input type="hidden" name="withdrawalId" value={id} />
                    <input type="hidden" name="outcome" value="complete" />
                    <Button type="submit" size="sm" variant="success">
                      Simular: pago (mock)
                    </Button>
                  </form>
                  <form action={simulatePayoutAction}>
                    <input type="hidden" name="withdrawalId" value={id} />
                    <input type="hidden" name="outcome" value="failed" />
                    <Button type="submit" size="sm" variant="outline">
                      Simular: falha (mock)
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}

          {w.status === "approved" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Aprovado, mas o envio ao provedor não foi concluído (ex.: IP não
                whitelistado). Reenvie quando a configuração estiver pronta.
              </p>
              <form action={retryPayoutAction}>
                <input type="hidden" name="withdrawalId" value={id} />
                <Button type="submit" variant="outline" size="sm">
                  Reenviar PIX Out
                </Button>
              </form>
            </div>
          )}

          {["paid", "rejected", "failed", "canceled"].includes(w.status) && (
            <p className="text-sm text-muted-foreground">
              Saque em estado terminal. Nenhuma ação disponível.
            </p>
          )}
        </CardContent>
      </Card>

      {payout && (
        <Card>
          <CardHeader>
            <CardTitle>Payout ({payout.provider})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <Info label="Referência" value={payout.provider_reference ?? "—"} />
            <Info label="Status" value={payout.status} />
            <Info label="End-to-end" value={payout.end_to_end_id ?? "—"} />
            <Info
              label="Taxa do provedor"
              value={
                payout.external_fee_cents != null
                  ? formatBRL(payout.external_fee_cents)
                  : "—"
              }
            />
            {payout.failure_reason && (
              <Info label="Falha" value={payout.failure_reason} />
            )}
          </CardContent>
        </Card>
      )}

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {events.map((e, i) => (
                <li key={i}>
                  <span className="text-foreground">
                    {e.from_status ?? "—"} → {e.to_status}
                  </span>
                  {e.reason && ` · ${e.reason}`} ·{" "}
                  {formatDateTimeBR(e.created_at)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  );
}
