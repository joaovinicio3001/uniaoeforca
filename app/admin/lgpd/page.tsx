import type { Metadata } from "next";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { hasServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { anonymizeUserAction } from "./actions";

export const metadata: Metadata = { title: "Solicitações LGPD" };

export default async function AdminLgpdPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const user = await requireStaff();
  const { ok, erro } = await searchParams;
  const canRun = can(user.roles, "users:manage");

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Solicitações LGPD</h1>
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
  const { data: reqs } = await admin
    .from("data_requests")
    .select("id, user_id, kind, status, created_at")
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Solicitações LGPD</h1>

      {ok && (
        <Alert variant="success">
          <AlertDescription>Processado ({ok}).</AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{decodeURIComponent(erro)}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pedidos de exclusão / exportação</CardTitle>
        </CardHeader>
        <CardContent>
          {!reqs || reqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação.</p>
          ) : (
            <ul className="divide-y text-sm">
              {reqs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-mono text-xs">{r.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.kind} · {r.status} · {formatDateTimeBR(r.created_at)}
                    </p>
                  </div>
                  {r.kind === "deletion" && r.status !== "done" && canRun && (
                    <form action={anonymizeUserAction}>
                      <input type="hidden" name="userId" value={r.user_id} />
                      <Button type="submit" size="sm" variant="destructive">
                        Anonimizar agora
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Anonimizar remove PII do perfil e das chaves PIX, torna doações anônimas,
        congela a carteira e bloqueia a conta. Registros financeiros são mantidos
        para retenção legal.
      </p>
    </div>
  );
}
