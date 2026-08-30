import type { Metadata } from "next";

import { requireStaff } from "@/lib/auth/session";
import { hasServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { listOpenRiskFlags, listBlocklist } from "@/lib/risk/service";
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
import {
  resolveFlagAction,
  blockUserAction,
  placeHoldAction,
  releaseHoldAction,
} from "./actions";

export const metadata: Metadata = { title: "Risco" };

const FLAG_LABEL: Record<string, string> = {
  velocity_withdrawals: "Velocidade de saques",
  velocity_donations: "Velocidade de doações",
  unusual_amount: "Valor incomum",
  fast_create_withdraw: "Criação → saque muito rápido",
  multi_account_ip: "Múltiplas contas (IP)",
  multi_account_cpf: "Múltiplas contas (CPF)",
  multi_account_pix: "Múltiplas contas (chave PIX)",
  blocklist_hit: "Está na blocklist",
  manual: "Manual",
};

export default async function AdminRiscoPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireStaff();
  const { ok, erro } = await searchParams;

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Risco</h1>
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
  const [flags, blocks, { data: holds }] = await Promise.all([
    listOpenRiskFlags(),
    listBlocklist(),
    admin
      .from("wallet_holds")
      .select("id, wallet_id, amount_cents, reason, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Risco</h1>

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
          <CardTitle>Flags abertas ({flags.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada aberto.</p>
          ) : (
            flags.map((f) => (
              <div key={f.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {FLAG_LABEL[f.type] ?? f.type}{" "}
                    <span
                      className={`ml-1 rounded px-1.5 py-0.5 text-[10px] ${
                        f.severity === "critical"
                          ? "bg-destructive/15 text-destructive"
                          : f.severity === "warning"
                            ? "bg-accent/20 text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTimeBR(f.created_at)}
                  </span>
                </div>
                {f.withdrawal_id && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    saque {f.withdrawal_id}
                  </p>
                )}
                <pre className="mt-1 overflow-x-auto text-xs text-muted-foreground">
                  {JSON.stringify(f.details)}
                </pre>
                <form action={resolveFlagAction} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="flagId" value={f.id} />
                  <input
                    name="note"
                    placeholder="Nota"
                    className="h-8 flex-1 rounded border border-input bg-card px-2 text-xs"
                  />
                  <Button type="submit" name="decision" value="resolved" size="sm" variant="outline">
                    Resolver
                  </Button>
                  <Button type="submit" name="decision" value="dismissed" size="sm" variant="ghost">
                    Descartar
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocklist de usuários</CardTitle>
          <CardDescription>
            Bloquear congela a carteira e impede novos saques (doc §7.3, §14).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={blockUserAction} className="flex flex-wrap items-end gap-2">
            <input
              name="userId"
              placeholder="user id (uuid)"
              className="h-9 min-w-[280px] flex-1 rounded border border-input bg-card px-2 text-sm"
            />
            <input
              name="reason"
              placeholder="motivo"
              className="h-9 flex-1 rounded border border-input bg-card px-2 text-sm"
            />
            <Button type="submit" name="block" value="true" size="sm" variant="destructive">
              Bloquear
            </Button>
          </form>
          {blocks.filter((b) => b.entity_type === "user").length > 0 && (
            <ul className="divide-y text-sm">
              {blocks
                .filter((b) => b.entity_type === "user")
                .map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="font-mono text-xs">{b.entity_value}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{b.reason}</span>
                      <form action={blockUserAction}>
                        <input type="hidden" name="userId" value={b.entity_value} />
                        <input type="hidden" name="reason" value="lift" />
                        <input type="hidden" name="block" value="false" />
                        <Button type="submit" size="sm" variant="ghost">
                          Desbloquear
                        </Button>
                      </form>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holds de saldo ({holds?.length ?? 0})</CardTitle>
          <CardDescription>
            Move saldo de disponível para retido, sem sair do ledger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={placeHoldAction} className="flex flex-wrap items-end gap-2">
            <input
              name="walletId"
              placeholder="wallet id (uuid)"
              className="h-9 min-w-[260px] flex-1 rounded border border-input bg-card px-2 text-sm"
            />
            <input
              name="amount"
              placeholder="valor R$"
              className="h-9 w-28 rounded border border-input bg-card px-2 text-sm"
            />
            <input
              name="reason"
              placeholder="motivo"
              className="h-9 flex-1 rounded border border-input bg-card px-2 text-sm"
            />
            <Button type="submit" size="sm" variant="outline">
              Reter
            </Button>
          </form>
          {holds && holds.length > 0 && (
            <ul className="divide-y text-sm">
              {holds.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {formatBRL(h.amount_cents)}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {h.reason} · {h.wallet_id.slice(0, 8)}
                    </span>
                  </span>
                  <form action={releaseHoldAction}>
                    <input type="hidden" name="holdId" value={h.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Liberar
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
