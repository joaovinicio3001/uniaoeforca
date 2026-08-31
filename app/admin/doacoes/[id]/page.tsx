import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { hasServiceRole } from "@/lib/env";
import { getDonationForAdmin } from "@/lib/payments/refunds";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { refundDonationAction, markRefundSettledAction } from "./actions";

export const metadata: Metadata = { title: "Doação" };

export default async function AdminDoacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const { ok, erro } = await searchParams;

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Doação</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = await getDonationForAdmin(id);
  if (!data) notFound();
  const { donation: d, payment, refund } = data;
  const camp = d.campaigns as
    | { title?: string; slug?: string; status?: string }
    | null;
  const canRefund = can(user.roles, "reconciliation:manage");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/doacoes">
          <ArrowLeft className="size-4" /> Doações
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{formatBRL(d.gross_amount_cents)}</h1>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {d.status}
        </span>
      </div>

      {ok === "estornado" && (
        <Alert variant="success">
          <AlertDescription>
            Estorno registrado. Faça a devolução PIX ao doador e depois dê baixa
            abaixo.
          </AlertDescription>
        </Alert>
      )}
      {ok === "baixa" && (
        <Alert variant="success">
          <AlertDescription>Devolução marcada como concluída.</AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>
            {erro === "motivo-obrigatorio"
              ? "Informe um motivo (mín. 5 caracteres)."
              : erro === "sem-permissao"
                ? "Estorno exige alçada financeira."
                : decodeURIComponent(erro)}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Info
            label="Campanha"
            value={camp?.title ?? "—"}
            href={camp?.slug ? `/campanhas/${camp.slug}` : undefined}
          />
          <Info label="Doador" value={d.anonymous ? "Anônimo" : d.donor_name ?? "—"} />
          <Info label="Bruto" value={formatBRL(d.gross_amount_cents)} />
          <Info label="Taxa da plataforma" value={formatBRL(d.platform_fee_cents)} />
          <Info label="Custo do provedor" value={formatBRL(d.provider_fee_cents)} />
          <Info label="Líquido à campanha" value={formatBRL(d.net_amount_cents)} />
          <Info label="Criada" value={formatDateTimeBR(d.created_at)} />
          <Info
            label="Paga"
            value={d.paid_at ? formatDateTimeBR(d.paid_at) : "—"}
          />
          {payment && (
            <>
              <Info label="Provedor" value={payment.provider} />
              <Info label="Referência" value={payment.provider_reference ?? "—"} />
              <Info label="End-to-end" value={payment.end_to_end_id ?? "—"} />
            </>
          )}
          {d.message && <Info label="Mensagem" value={d.message} />}
        </CardContent>
      </Card>

      {refund ? (
        <Card>
          <CardHeader>
            <CardTitle>Estorno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="Valor estornado" value={formatBRL(refund.amount_cents)} />
            <Info label="Motivo" value={refund.reason} />
            <Info
              label="Registrado em"
              value={formatDateTimeBR(refund.created_at)}
            />
            <Info
              label="Devolução PIX ao doador"
              value={refund.provider_refunded ? "Concluída" : "Pendente"}
            />
            {!refund.provider_refunded && canRefund && (
              <form action={markRefundSettledAction}>
                <input type="hidden" name="donationId" value={id} />
                <Button type="submit" size="sm" variant="outline">
                  Marcar devolução como concluída
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : d.status === "paid" ? (
        <Card>
          <CardHeader>
            <CardTitle>Estornar doação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reverte os lançamentos no ledger e devolve a taxa da plataforma. O
              valor sai do saldo disponível da campanha. A devolução PIX ao
              doador é feita manualmente depois.
            </p>
            {canRefund ? (
              <form action={refundDonationAction} className="space-y-2">
                <input type="hidden" name="donationId" value={id} />
                <textarea
                  name="reason"
                  required
                  rows={2}
                  placeholder="Motivo do estorno (registrado e notificado)"
                  className="w-full rounded-md border border-input bg-card p-2 text-sm"
                />
                <Button type="submit" variant="destructive" size="sm">
                  Estornar {formatBRL(d.gross_amount_cents)}
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground">
                Estorno exige o papel de <strong>financeiro</strong>.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Só doações pagas podem ser estornadas.
        </p>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {href ? (
        <Link
          href={href}
          target="_blank"
          className="font-medium text-primary hover:underline"
        >
          {value}
        </Link>
      ) : (
        <p className="font-medium break-words">{value}</p>
      )}
    </div>
  );
}
