import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { formatDateTimeBR } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/campaigns/state-machine";

export const metadata: Metadata = { title: "Moderação de campanhas" };

const FILTERS: { key: string; label: string; statuses: CampaignStatus[] }[] = [
  { key: "fila", label: "Fila de análise", statuses: ["pending_review"] },
  { key: "ativas", label: "Ativas", statuses: ["active"] },
  { key: "bloqueadas", label: "Bloqueadas", statuses: ["blocked"] },
  {
    key: "todas",
    label: "Todas",
    statuses: [
      "draft", "pending_review", "active", "paused",
      "completed", "rejected", "blocked", "archived",
    ],
  },
];

export default async function AdminCampanhasPage({
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
        <h1 className="text-2xl font-bold">Moderação de campanhas</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code> para carregar a fila.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ data: campaigns }, { data: openReports }] = await Promise.all([
    admin
      .from("campaigns")
      .select("id, title, slug, status, created_at, published_at")
      .in("status", active.statuses)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("reports")
      .select("campaign_id")
      .in("status", ["open", "reviewing"]),
  ]);

  const reportCount = new Map<string, number>();
  for (const r of openReports ?? []) {
    reportCount.set(r.campaign_id, (reportCount.get(r.campaign_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderação de campanhas</h1>

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/campanhas?filtro=${f.key}`}
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

      {!campaigns || campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Nada nesta lista.
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/campanhas/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /{c.slug} · criada {formatDateTimeBR(c.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {reportCount.get(c.id) ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      {reportCount.get(c.id)} denúncia(s)
                    </span>
                  ) : null}
                  <CampaignStatusBadge status={c.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
