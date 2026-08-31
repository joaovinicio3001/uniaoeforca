import type { Metadata } from "next";
import { Megaphone, Plus } from "lucide-react";

import { listMyCampaignsWithMeta } from "@/lib/campaigns/queries";
import { publicEnv } from "@/lib/env";
import { MyCampaignCard } from "@/components/campaigns/my-campaign-card";
import {
  DashLinkButton,
  EmptyState,
  PageHeader,
  SectionCard,
} from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Minhas campanhas" };

export default async function MinhasCampanhasPage() {
  const campaigns = await listMyCampaignsWithMeta();
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas campanhas"
        subtitle={`${campaigns.length} ${campaigns.length === 1 ? "campanha" : "campanhas"} no total.`}
        actions={
          <DashLinkButton href="/painel/campanhas/nova">
            <Plus className="size-4" /> Nova campanha
          </DashLinkButton>
        }
      />

      {campaigns.length === 0 ? (
        <SectionCard bodyClassName="p-0">
          <EmptyState
            icon={Megaphone}
            title="Você ainda não criou nenhuma campanha."
            description="Crie a sua primeira campanha para começar a arrecadar."
            action={
              <DashLinkButton href="/painel/campanhas/nova">
                <Plus className="size-4" /> Criar a primeira
              </DashLinkButton>
            }
          />
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <MyCampaignCard key={c.id} c={c} siteUrl={siteUrl} />
          ))}
          <p className="pt-1 text-center text-[13px] text-[#5B6B88]">
            Mostrando {campaigns.length} de {campaigns.length}{" "}
            {campaigns.length === 1 ? "campanha" : "campanhas"}
          </p>
        </div>
      )}
    </div>
  );
}
