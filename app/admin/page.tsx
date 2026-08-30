import type { Metadata } from "next";

import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { formatDateTimeBR } from "@/lib/utils";
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

  let counts = { users: 0, staff: 0, campaigns: 0, withdrawals: 0 };
  let recentAudit: {
    action: string;
    entity_type: string;
    created_at: string;
  }[] = [];
  const canQuery = hasServiceRole();

  if (canQuery) {
    const admin = createAdminClient();
    const [{ count: users }, { count: staff }, { data: audit }] =
      await Promise.all([
        admin.from("profiles").select("*", { count: "exact", head: true }),
        admin
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .in("role", ["analista", "financeiro", "admin", "superadmin"]),
        admin
          .from("audit_logs")
          .select("action, entity_type, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
    counts = {
      users: users ?? 0,
      staff: staff ?? 0,
      campaigns: 0,
      withdrawals: 0,
    };
    recentAudit = audit ?? [];
  }

  const cards = [
    { label: "Usuários", value: counts.users },
    { label: "Membros de equipe", value: counts.staff },
    { label: "Campanhas ativas", value: counts.campaigns, soon: true },
    { label: "Saques na fila", value: counts.withdrawals, soon: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão operacional. Métricas de GMV, receita, conciliação e SLA de saque
          entram nas Fases 2–6 (doc §13.1).
        </p>
      </div>

      {!canQuery && (
        <Alert variant="warning">
          <AlertTitle>Somente leitura limitada</AlertTitle>
          <AlertDescription>
            Configure <code>SUPABASE_SERVICE_ROLE_KEY</code> no <code>.env.local</code>{" "}
            para carregar contadores e a trilha de auditoria aqui.
          </AlertDescription>
        </Alert>
      )}

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
                {c.soon ? "—" : c.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auditoria recente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento registrado ainda.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {recentAudit.map((e, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span className="font-medium">{e.action}</span>
                  <span className="text-muted-foreground">{e.entity_type}</span>
                  <span className="text-muted-foreground">
                    {formatDateTimeBR(e.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
