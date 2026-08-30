import type { Metadata } from "next";

import { requireStaff } from "@/lib/auth/session";
import { hasServiceRole } from "@/lib/env";
import {
  listOpenReconItems,
  listReconRuns,
} from "@/lib/reconciliation/service";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { runReconAction, resolveReconItemAction } from "./actions";

export const metadata: Metadata = { title: "Conciliação" };

export default async function ConciliacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireStaff();
  const { ok, erro } = await searchParams;

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Conciliação</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [items, runs] = await Promise.all([
    listOpenReconItems(),
    listReconRuns(10),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conciliação financeira</h1>

      {ok && (
        <Alert variant="success">
          <AlertDescription>Ação registrada ({ok}).</AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{decodeURIComponent(erro)}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rodar conciliação</CardTitle>
          <CardDescription>
            Também roda sozinha diariamente via cron (doc §29).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(
            [
              ["pix_in", "PIX In (Pushin Pay)"],
              ["pix_out", "PIX Out (GGPix)"],
              ["ledger_internal", "Ledger interno"],
            ] as const
          ).map(([kind, label]) => (
            <form key={kind} action={runReconAction}>
              <input type="hidden" name="kind" value={kind} />
              <Button type="submit" size="sm" variant="outline">
                {label}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Divergências abertas ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma divergência aberta.
            </p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {it.kind} · {it.status}
                    {it.provider ? ` · ${it.provider}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTimeBR(it.created_at)}
                  </span>
                </div>
                {(it.amount_expected_cents != null ||
                  it.amount_actual_cents != null) && (
                  <p className="text-xs text-muted-foreground">
                    esperado {formatBRL(it.amount_expected_cents ?? 0)} · real{" "}
                    {formatBRL(it.amount_actual_cents ?? 0)}
                  </p>
                )}
                <pre className="mt-1 overflow-x-auto text-xs text-muted-foreground">
                  {JSON.stringify(it.details)}
                </pre>
                <form
                  action={resolveReconItemAction}
                  className="mt-2 flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="itemId" value={it.id} />
                  <input
                    name="note"
                    placeholder="Como foi resolvido"
                    className="h-8 flex-1 rounded border border-input bg-card px-2 text-xs"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Marcar resolvido
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Execuções recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {runs.map((r) => (
              <li key={r.id}>
                {formatDateTimeBR(r.started_at)} · {r.kind} · {r.status} ·{" "}
                {r.items_checked} verificados · {r.divergences} divergência(s)
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
