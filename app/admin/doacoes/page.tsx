import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Doações e pagamentos" };

export default async function AdminDoacoesPage() {
  const user = await requireStaff();
  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Doações e pagamentos</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ data: recent }, agg, { data: webhooks }] = await Promise.all([
    admin
      .from("donations")
      .select("id, gross_amount_cents, net_amount_cents, platform_fee_cents, provider_fee_cents, status, created_at, paid_at, campaigns(title)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("donations").select("status, gross_amount_cents, platform_fee_cents"),
    admin
      .from("webhook_events")
      .select("event_id, status, received_at, processed_at, error")
      .order("received_at", { ascending: false })
      .limit(15),
  ]);

  const rows = agg.data ?? [];
  const paid = rows.filter((r) => r.status === "paid");
  const gmv = paid.reduce((s, r) => s + r.gross_amount_cents, 0);
  const revenue = paid.reduce((s, r) => s + r.platform_fee_cents, 0);
  const pending = rows.filter((r) => r.status === "pending" || r.status === "created").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Doações e pagamentos</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="GMV (pago)" value={formatBRL(gmv)} />
        <Stat label="Receita de taxa" value={formatBRL(revenue)} />
        <Stat label="Pendentes / iniciadas" value={String(pending)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas doações</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-2">Campanha</th>
                <th>Bruto</th>
                <th>Taxa plat.</th>
                <th>Líquido</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(recent ?? []).map((d) => (
                <tr key={d.id}>
                  <td className="py-2 pr-2">
                    <Link
                      href={`/admin/doacoes/${d.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {(d.campaigns as { title?: string } | null)?.title ?? "—"}
                    </Link>
                  </td>
                  <td className="tabular-nums">{formatBRL(d.gross_amount_cents)}</td>
                  <td className="tabular-nums">{formatBRL(d.platform_fee_cents)}</td>
                  <td className="tabular-nums">{formatBRL(d.net_amount_cents)}</td>
                  <td>{d.status}</td>
                  <td className="text-muted-foreground">
                    {formatDateTimeBR(d.paid_at ?? d.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks recebidos</CardTitle>
        </CardHeader>
        <CardContent>
          {!webhooks || webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento ainda.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {webhooks.map((w) => (
                <li key={w.event_id} className="flex flex-wrap gap-x-2 text-muted-foreground">
                  <span className="font-mono text-foreground">{w.event_id}</span>
                  <span>· {w.status}</span>
                  {w.error && <span className="text-destructive">· {w.error}</span>}
                  <span>· {formatDateTimeBR(w.received_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!can(user.roles, "reconciliation:manage") && (
        <p className="text-xs text-muted-foreground">
          Conciliação completa (Pushin Pay × ledger) entra na Fase 6.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
