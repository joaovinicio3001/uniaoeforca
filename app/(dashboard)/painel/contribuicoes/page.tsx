import type { Metadata } from "next";
import { CalendarDays, CircleDollarSign, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { formatBRL } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/dashboard/ui";
import {
  ContributionsView,
  type ContributionRow,
} from "./contributions-view";

export const metadata: Metadata = { title: "Minhas contribuições" };

export default async function ContribuicoesPage() {
  const user = (await getSessionUser())!;
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select(
      "id, gross_amount_cents, status, created_at, paid_at, campaigns(slug, title, summary, campaign_media!campaigns_cover_media_fk(public_url))",
    )
    .eq("donor_user_id", user.id)
    .order("created_at", { ascending: false });

  const rows: ContributionRow[] = (data ?? []).map((d) => {
    const camp = d.campaigns as {
      slug?: string;
      title?: string;
      summary?: string;
      campaign_media?: { public_url?: string } | null;
    } | null;
    return {
      id: d.id,
      gross_amount_cents: d.gross_amount_cents,
      status: d.status,
      created_at: d.created_at,
      paid_at: d.paid_at,
      campaignSlug: camp?.slug ?? null,
      campaignTitle: camp?.title ?? "Campanha",
      campaignSummary: camp?.summary ?? null,
      coverUrl: camp?.campaign_media?.public_url ?? null,
      payUrl:
        d.status === "pending" && camp?.slug
          ? `/campanhas/${camp.slug}/contribuir/${d.id}`
          : null,
    };
  });

  const paid = rows.filter((r) => r.status === "paid");
  const totalCents = paid.reduce((s, r) => s + r.gross_amount_cents, 0);
  const lastPaid = paid[0]?.created_at ?? rows[0]?.created_at ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas contribuições"
        subtitle="Histórico das doações feitas com esta conta."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={CircleDollarSign}
          tone="blue"
          label="Total contribuído"
          value={formatBRL(totalCents)}
          hint="Em doações confirmadas"
        />
        <StatCard
          icon={Users}
          tone="green"
          label="Contribuições confirmadas"
          value={String(paid.length)}
          hint={`${rows.length} no total`}
        />
        <StatCard
          icon={CalendarDays}
          tone="amber"
          label="Última contribuição"
          value={
            lastPaid
              ? new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  timeZone: "America/Sao_Paulo",
                }).format(new Date(lastPaid))
              : "—"
          }
        />
      </div>

      <ContributionsView rows={rows} />
    </div>
  );
}
