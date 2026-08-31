import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Megaphone,
  ShieldAlert,
  Scale,
} from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { hasServiceRole } from "@/lib/env";
import { getAdminOverview, getAdminQueues } from "@/lib/admin/overview";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Dashboard administrativo" };

export default async function AdminDashboardPage() {
  await requireStaff();

  if (!hasServiceRole()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Alert variant="warning">
          <AlertTitle>Somente leitura limitada</AlertTitle>
          <AlertDescription>
            Configure <code>SUPABASE_SERVICE_ROLE_KEY</code> no{" "}
            <code>.env.local</code> para carregar as métricas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [ov, queues] = await Promise.all([getAdminOverview(), getAdminQueues()]);
  if (!ov || !queues) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar as métricas agora.
        </p>
      </div>
    );
  }

  const alerts: { tone: "warning" | "destructive"; text: string; href: string }[] =
    [];
  if (ov.ledgerImbalanced && ov.ledgerImbalanced > 0) {
    alerts.push({
      tone: "destructive",
      text: `${ov.ledgerImbalanced} transação(ões) de ledger desbalanceada(s)`,
      href: "/admin/financeiro",
    });
  }
  if (ov.riskOpen > 0) {
    alerts.push({
      tone: "warning",
      text: `${ov.riskOpen} sinal(is) de risco em aberto`,
      href: "/admin/risco",
    });
  }
  if (ov.reportsOpen > 0) {
    alerts.push({
      tone: "warning",
      text: `${ov.reportsOpen} denúncia(s) de campanha em aberto`,
      href: "/admin/campanhas",
    });
  }
  if (ov.reconOpen > 0) {
    alerts.push({
      tone: "warning",
      text: `${ov.reconOpen} item(ns) de conciliação em aberto`,
      href: "/admin/conciliacao",
    });
  }
  if (ov.supportOpen > 0) {
    alerts.push({
      tone: "warning",
      text: `${ov.supportOpen} chamado(s) de suporte aguardando`,
      href: "/admin/suporte",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão operacional da plataforma. Valores de doações confirmadas.
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Link key={a.href + a.text} href={a.href}>
              <Alert variant={a.tone}>
                <AlertTriangle className="size-4" />
                <AlertDescription className="flex items-center justify-between gap-2">
                  <span>{a.text}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </AlertDescription>
              </Alert>
            </Link>
          ))}
        </div>
      )}

      {/* Financeiro */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="GMV (30 dias)" value={formatBRL(ov.gmv30dCents)} sub={`${formatBRL(ov.gmvTotalCents)} no total`} />
        <Metric label="Receita de taxa (30 dias)" value={formatBRL(ov.revenue30dCents)} sub={`${formatBRL(ov.revenueTotalCents)} no total`} />
        <Metric label="Doações pagas (30 dias)" value={String(ov.donationsPaid30d)} sub={`${ov.donationsPaidTotal} no total`} />
        <Metric label="Usuários" value={String(ov.usersTotal)} />
      </div>

      {/* Filas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QueueCard
          icon={Banknote}
          label="Saques na fila"
          value={ov.withdrawalsQueue}
          sub={`${ov.withdrawalsProcessing} processando · ${formatBRL(
            ov.withdrawalsOpenAmountCents,
          )} em aberto`}
          href="/admin/saques"
        />
        <QueueCard
          icon={Megaphone}
          label="Campanhas em análise"
          value={ov.campaignsPendingReview}
          sub={`${ov.campaignsActive} ativas`}
          href="/admin/campanhas"
        />
        <QueueCard
          icon={BadgeCheck}
          label="Verificações pendentes"
          value={ov.kycPending}
          href="/admin/kyc"
        />
        <QueueCard
          icon={ShieldAlert}
          label="Risco em aberto"
          value={ov.riskOpen}
          href="/admin/risco"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard
          title="Saques aguardando análise"
          href="/admin/saques"
          empty="Nenhum saque na fila."
          rows={queues.withdrawals.map((w) => ({
            key: w.id,
            href: `/admin/saques/${w.id}`,
            left: formatBRL(w.amount_cents),
            right: formatDateTimeBR(w.requested_at),
            tag: w.status,
          }))}
        />
        <ListCard
          title="Campanhas aguardando aprovação"
          href="/admin/campanhas"
          empty="Nenhuma campanha em análise."
          rows={queues.campaigns.map((c) => ({
            key: c.id,
            href: `/admin/campanhas/${c.id}`,
            left: c.title,
            right: formatBRL(c.goal_amount_cents),
            tag: formatDateTimeBR(c.created_at),
          }))}
        />
        <ListCard
          title="Verificações aguardando"
          href="/admin/kyc"
          empty="Nenhuma verificação pendente."
          rows={queues.kyc.map((k) => ({
            key: k.id,
            href: `/admin/kyc/${k.id}`,
            left: `Nível ${k.level}`,
            right: k.submitted_at ? formatDateTimeBR(k.submitted_at) : "—",
            tag: k.status,
          }))}
        />
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-4" /> Auditoria recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queues.audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum evento registrado.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {queues.audit.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 py-2">
                    <span className="font-medium">{e.action}</span>
                    <span className="text-muted-foreground">{e.entity_type}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatDateTimeBR(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function QueueCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Icon className="size-4" /> {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

function ListCard({
  title,
  href,
  empty,
  rows,
}: {
  title: string;
  href: string;
  empty: string;
  rows: {
    key: string;
    href: string;
    left: string;
    right: string;
    tag: string;
  }[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Link
          href={href}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver tudo
        </Link>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map((r) => (
              <li key={r.key}>
                <Link
                  href={r.href}
                  className="flex items-center justify-between gap-2 py-2 hover:text-primary"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {r.left}
                  </span>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {r.tag}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.right}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
