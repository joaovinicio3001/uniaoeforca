import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/session";
import { hasServiceRole } from "@/lib/env";
import { listWithdrawalsQueue, type WithdrawalStatus } from "@/lib/withdrawals/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WithdrawalStatusBadge } from "@/components/withdrawals/status-badge";

export const metadata: Metadata = { title: "Fila de saques" };

const FILTERS: { key: string; label: string; statuses: WithdrawalStatus[] }[] = [
  { key: "fila", label: "Fila (SLA 24h)", statuses: ["requested", "under_review"] },
  { key: "andamento", label: "Aprovados / processando", statuses: ["approved", "processing"] },
  { key: "concluidos", label: "Pagos", statuses: ["paid"] },
  { key: "problemas", label: "Rejeitados / falhos", statuses: ["rejected", "failed", "canceled"] },
];

export default async function AdminSaquesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  await requireStaff();
  const { filtro } = await searchParams;
  const active = FILTERS.find((f) => f.key === filtro) ?? FILTERS[0]!;

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Fila de saques</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rows = await listWithdrawalsQueue(active.statuses);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fila de saques</h1>

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/saques?filtro=${f.key}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              f.key === active.key
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-secondary",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Nada nesta lista.
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows.map((w) => {
            const snap = w.pix_key_snapshot as { masked?: string } | null;
            return (
              <li key={w.id}>
                <Link
                  href={`/admin/saques/${w.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-secondary/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">
                      {formatBRL(w.amount_cents)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        líquido {formatBRL(w.net_cents)} → {snap?.masked ?? "—"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado {formatDateTimeBR(w.requested_at)}
                    </p>
                  </div>
                  <WithdrawalStatusBadge status={w.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
