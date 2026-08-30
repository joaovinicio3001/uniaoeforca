import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getCampaignMedia,
  getMyCampaign,
} from "@/lib/campaigns/queries";
import { getCampaignLedgerTotals } from "@/lib/ledger/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  OWNER_EDITABLE_STATUSES,
  allowedTransitions,
  type CampaignStatus,
} from "@/lib/campaigns/state-machine";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";
import { MediaManager } from "@/components/campaigns/media-manager";
import { UpdateComposer } from "@/components/campaigns/update-composer";
import {
  submitForReviewAction,
  withdrawSubmissionAction,
  pauseCampaignAction,
  resumeCampaignAction,
  completeCampaignAction,
  archiveCampaignAction,
  saveCampaignAction,
} from "../actions";

export const metadata: Metadata = { title: "Gerenciar campanha" };

const TRANSITION_UI: Partial<
  Record<
    CampaignStatus,
    { label: string; action: (fd: FormData) => void; variant?: "outline" | "destructive" | "success" }
  >
> = {
  pending_review: { label: "Enviar para análise", action: submitForReviewAction, variant: "success" },
  draft: { label: "Retirar da análise", action: withdrawSubmissionAction, variant: "outline" },
  paused: { label: "Pausar", action: pauseCampaignAction, variant: "outline" },
  active: { label: "Retomar", action: resumeCampaignAction, variant: "success" },
  completed: { label: "Encerrar (concluída)", action: completeCampaignAction, variant: "outline" },
  archived: { label: "Arquivar", action: archiveCampaignAction, variant: "outline" },
};

export default async function GerenciarCampanhaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const user = (await getSessionUser())!;
  const campaign = await getMyCampaign(id);

  if (!campaign || campaign.owner_user_id !== user.id) notFound();

  const status = campaign.status as CampaignStatus;
  const editable = OWNER_EDITABLE_STATUSES.includes(status);
  const nextStates = allowedTransitions(status, "owner");

  const supabase = await createClient();
  const [media, { data: updates }, { data: modEvents }, { data: cat }] =
    await Promise.all([
    getCampaignMedia(id),
    supabase
      .from("campaign_updates")
      .select("id, title, published_at, created_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_moderation_events")
      .select("id, from_status, to_status, reason, created_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    campaign.category_id
      ? supabase
          .from("categories")
          .select("slug")
          .eq("id", campaign.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const totals = await getCampaignLedgerTotals(id);

  const goalReais = (campaign.goal_amount_cents / 100)
    .toFixed(2)
    .replace(".", ",");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <CampaignStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">/campanhas/{campaign.slug}</p>
        </div>
        {(status === "active" || status === "completed") && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/campanhas/${campaign.slug}`} target="_blank">
              <ExternalLink className="size-4" /> Ver página pública
            </Link>
          </Button>
        )}
      </div>

      {ok === "enviada" && (
        <Alert variant="success">
          <AlertDescription>
            Campanha enviada para análise. Você será avisado quando houver decisão.
          </AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{decodeURIComponent(erro)}</AlertDescription>
        </Alert>
      )}
      {status === "rejected" && campaign.moderation_reason && (
        <Alert variant="warning">
          <AlertTitle>Campanha reprovada</AlertTitle>
          <AlertDescription>
            Motivo: {campaign.moderation_reason}. Ajuste os dados e reenvie.
          </AlertDescription>
        </Alert>
      )}
      {status === "blocked" && (
        <Alert variant="destructive">
          <AlertTitle>Campanha bloqueada</AlertTitle>
          <AlertDescription>
            {campaign.moderation_reason ?? "Contate o suporte para mais informações."}
          </AlertDescription>
        </Alert>
      )}

      {/* Barra de ações de status */}
      {nextStates.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-3">
          {nextStates.map((to) => {
            const ui = TRANSITION_UI[to];
            if (!ui) return null;
            return (
              <form key={to} action={ui.action}>
                <input type="hidden" name="campaignId" value={id} />
                <Button type="submit" size="sm" variant={ui.variant ?? "outline"}>
                  {ui.label}
                </Button>
              </form>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da campanha</CardTitle>
          <CardDescription>
            {editable
              ? "Editável enquanto rascunho ou reprovada."
              : "Bloqueado para edição no status atual. Use as ações acima."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm
            action={saveCampaignAction}
            submitLabel="Salvar alterações"
            editable={editable}
            initial={{
              id: campaign.id,
              title: campaign.title,
              categorySlug: (cat as { slug?: string } | null)?.slug,
              summary: campaign.summary,
              story: campaign.story,
              goalReais,
              city: campaign.city ?? "",
              state: campaign.state ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
          <CardDescription>
            Calculado a partir de todas as doações confirmadas. {totals.count}{" "}
            {totals.count === 1 ? "doação recebida" : "doações recebidas"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">Crédito líquido</dt>
              <dd className="text-lg font-bold tabular-nums">
                {formatBRL(totals.netCents)}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">Taxa da plataforma</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {formatBRL(totals.platformFeeCents)}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">
                Custo estimado do provedor
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {formatBRL(totals.providerFeeCents)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            O saldo sacável fica na sua{" "}
            <Link href="/painel/carteira" className="text-primary hover:underline">
              carteira
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imagens</CardTitle>
          <CardDescription>
            A primeira imagem vira a capa automaticamente. Você pode trocar a
            capa a qualquer momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaManager
            campaignId={id}
            media={media.map((m) => ({
              id: m.id,
              public_url: m.public_url,
              isCover: m.id === campaign.cover_media_id,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atualizações</CardTitle>
          <CardDescription>
            Publique novidades para quem apoia a sua campanha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <UpdateComposer campaignId={id} />
          {updates && updates.length > 0 && (
            <ul className="divide-y border-t text-sm">
              {updates.map((u) => (
                <li key={u.id} className="flex justify-between gap-2 py-2">
                  <span>{u.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {u.published_at
                      ? formatDateTimeBR(u.published_at)
                      : "rascunho"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {modEvents && modEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {modEvents.map((e) => (
                <li key={e.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
                  <span className="text-foreground">
                    {e.from_status ?? "—"} → {e.to_status}
                  </span>
                  {e.reason && <span>· {e.reason}</span>}
                  <span>· {formatDateTimeBR(e.created_at)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
