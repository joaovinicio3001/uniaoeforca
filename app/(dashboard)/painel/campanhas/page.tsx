import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { listMyCampaigns, progressPercent } from "@/lib/campaigns/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { ProgressBar } from "@/components/campaigns/progress-bar";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";

export const metadata: Metadata = { title: "Minhas campanhas" };

export default async function MinhasCampanhasPage() {
  const campaigns = await listMyCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-[#071D4A] sm:text-[28px]">
            Minhas campanhas
          </h1>
          <p className="mt-1 text-[15px] text-[#5B6B88]">
            {campaigns.length} no total.
          </p>
        </div>
        <Link
          href="/painel/campanhas/nova"
          className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-[#0645D8] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(6,69,216,0.25)] transition-colors hover:bg-[#0B55E8]"
        >
          <Plus className="size-4" /> Nova campanha
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#CBD8EC] bg-white p-12 text-center">
          <p className="text-[15px] text-[#5B6B88]">
            Você ainda não criou nenhuma campanha.
          </p>
          <Link
            href="/painel/campanhas/nova"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-[11px] bg-[#0645D8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B55E8]"
          >
            <Plus className="size-4" /> Criar a primeira
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/painel/campanhas/${c.id}`}
                className="block rounded-[16px] border border-[#E1E8F2] bg-white p-4 shadow-[0_8px_25px_rgba(20,50,100,0.05)] transition-shadow hover:shadow-[0_10px_28px_rgba(20,50,100,0.1)] sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-[#071D4A]">
                      {c.title}
                    </h2>
                    <p className="text-xs text-[#5B6B88]">
                      Atualizada em {formatDateTimeBR(c.updated_at)}
                    </p>
                  </div>
                  <CampaignStatusBadge status={c.status} />
                </div>
                <div className="mt-3 space-y-1">
                  <ProgressBar percent={progressPercent(c)} />
                  <div className="flex justify-between text-sm text-[#5B6B88]">
                    <span className="font-medium text-[#071D4A]">
                      {formatBRL(c.raised_amount_cents)}
                    </span>
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
