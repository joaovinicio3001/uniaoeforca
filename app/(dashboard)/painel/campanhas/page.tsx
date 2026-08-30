import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { listMyCampaigns } from "@/lib/campaigns/queries";
import { progressPercent } from "@/lib/campaigns/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/campaigns/progress-bar";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";

export const metadata: Metadata = { title: "Minhas campanhas" };

export default async function MinhasCampanhasPage() {
  const campaigns = await listMyCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas campanhas</h1>
          <p className="text-muted-foreground">
            {campaigns.length} no total.
          </p>
        </div>
        <Button asChild>
          <Link href="/painel/campanhas/nova">
            <Plus className="size-4" /> Nova campanha
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Você ainda não criou nenhuma campanha.
          </p>
          <Button asChild className="mt-4">
            <Link href="/painel/campanhas/nova">Criar a primeira</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/painel/campanhas/${c.id}`}
                className="block rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{c.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      Atualizada em {formatDateTimeBR(c.updated_at)}
                    </p>
                  </div>
                  <CampaignStatusBadge status={c.status} />
                </div>
                <div className="mt-3 space-y-1">
                  <ProgressBar percent={progressPercent(c)} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatBRL(c.raised_amount_cents)} arrecadados</span>
                    <span>Meta {formatBRL(c.goal_amount_cents)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
