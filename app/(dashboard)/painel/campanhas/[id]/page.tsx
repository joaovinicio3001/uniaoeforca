import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ExternalLink, Eye, Users } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import {
  getCampaignDonations,
  getCampaignMedia,
  getMyCampaign,
  progressPercent,
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
import { ShareButton } from "@/components/campaigns/share-button";
import { ProgressBar } from "@/components/campaigns/progress-bar";
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

const TABS = [
  { key: "visao", label: "Visão geral" },
  { key: "editar", label: "Editar" },
  { key: "doacoes", label: "Doações" },
  { key: "atualizacoes", label: "Atualizações" },
  { key: "compartilhar", label: "Compartilhar" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const TRANSITION_UI: Partial<
  Record<
    CampaignStatus,
    {
      label: string;
      action: (fd: FormData) => void;
      variant?: "outline" | "destructive" | "success";
    }
  >
> = {
  pending_review: {
    label: "Enviar para análise",
    action: submitForReviewAction,
    variant: "success",
  },
  draft: {
    label: "Retirar da análise",
    action: withdrawSubmissionAction,
    variant: "outline",
  },
  paused: { label: "Pausar", action: pauseCampaignAction, variant: "outline" },
  active: { label: "Retomar", action: resumeCampaignAction, variant: "success" },
  completed: {
    label: "Encerrar (concluída)",
    action: completeCampaignAction,
    variant: "outline",
  },
  archived: {
    label: "Arquivar",
    action: archiveCampaignAction,
    variant: "outline",
  },
};

export default async function GerenciarCampanhaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string; aba?: string }>;
}) {
  const { id } = await params;
  const { ok, erro, aba } = await searchParams;
  const user = (await getSessionUser())!;
  const campaign = await getMyCampaign(id);

  if (!campaign || campaign.owner_user_id !== user.id) notFound();

  const status = campaign.status as CampaignStatus;
  const editable = OWNER_EDITABLE_STATUSES.includes(status);
  const nextStates = allowedTransitions(status, "owner");
  const tab: TabKey = (TABS.find((t) => t.key === aba)?.key ?? "visao") as TabKey;

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
  const donations = tab === "doacoes" ? await getCampaignDonations(id) : [];

  const goalReais = (campaign.goal_amount_cents / 100)
    .toFixed(2)
    .replace(".", ",");
  const pct = progressPercent(campaign);
  const publicUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")}/campanhas/${campaign.slug}`;
  const isPublic = status === "active" || status === "completed";
  const qrDataUrl =
    tab === "compartilhar" && isPublic
      ? await QRCode.toDataURL(publicUrl, { width: 240, margin: 1 })
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <CampaignStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            /campanhas/{campaign.slug}
          </p>
        </div>
        {isPublic && (
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
            Campanha enviada para análise. Você será avisado quando houver
            decisão.
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
            {campaign.moderation_reason ??
              "Contate o suporte para mais informações."}
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

      {/* Abas */}
      <div className="border-b">
        <div className="-mb-px flex flex-wrap gap-x-5 gap-y-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/painel/campanhas/${id}?aba=${t.key}`}
              className={`border-b-2 pb-2.5 text-sm font-medium ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {tab === "visao" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arrecadação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums">
                  {formatBRL(campaign.raised_amount_cents)}
                </span>
                <span className="text-sm text-muted-foreground">
                  meta {formatBRL(campaign.goal_amount_cents)} · {pct}%
                </span>
              </div>
              <ProgressBar percent={pct} />
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                <Stat
                  icon={<Users className="size-4" />}
                  label="Apoiadores"
                  value={String(campaign.supporters_count)}
                />
                <Stat
                  icon={<Eye className="size-4" />}
                  label="Visualizações"
                  value={campaign.view_count.toLocaleString("pt-BR")}
                />
                <Stat
                  label="Doações pagas"
                  value={String(totals.count)}
                />
                <Stat
                  label="Crédito líquido"
                  value={formatBRL(totals.netCents)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>
                Calculado a partir de todas as doações confirmadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-3">
                <Box label="Crédito líquido" value={formatBRL(totals.netCents)} />
                <Box
                  label="Taxa da plataforma"
                  value={formatBRL(totals.platformFeeCents)}
                />
                <Box
                  label="Custo estimado do provedor"
                  value={formatBRL(totals.providerFeeCents)}
                />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                O saldo sacável fica na sua{" "}
                <Link
                  href="/painel/carteira"
                  className="text-primary hover:underline"
                >
                  carteira
                </Link>
                .
              </p>
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
                    <li
                      key={e.id}
                      className="flex flex-wrap gap-x-2 text-muted-foreground"
                    >
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
      )}

      {tab === "editar" && (
        <div className="space-y-6">
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
        </div>
      )}

      {tab === "doacoes" && (
        <Card>
          <CardHeader>
            <CardTitle>Doações ({donations.length})</CardTitle>
            <CardDescription>
              Doadores que optaram por anonimato aparecem como “Anônimo”.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {donations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma doação ainda.
              </p>
            ) : (
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2">Doador</th>
                    <th>Valor</th>
                    <th>Líquido</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {donations.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2 pr-2">
                        <span className="font-medium">{d.donor}</span>
                        {d.message && (
                          <span className="block text-xs text-muted-foreground">
                            “{d.message}”
                          </span>
                        )}
                      </td>
                      <td className="tabular-nums">
                        {formatBRL(d.gross_amount_cents)}
                      </td>
                      <td className="tabular-nums text-muted-foreground">
                        {formatBRL(d.net_amount_cents)}
                      </td>
                      <td>{d.status}</td>
                      <td className="text-muted-foreground">
                        {formatDateTimeBR(d.paid_at ?? d.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "atualizacoes" && (
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
      )}

      {tab === "compartilhar" && (
        <Card>
          <CardHeader>
            <CardTitle>Compartilhar</CardTitle>
            <CardDescription>
              {isPublic
                ? "Divulgue o link para receber doações."
                : "A campanha ainda não está pública. O link e o QR code funcionam depois da aprovação."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-1.5 text-sm font-medium">Link público</p>
              <input
                readOnly
                value={publicUrl}
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
              />
            </div>

            {qrDataUrl && (
              <div>
                <p className="mb-1.5 text-sm font-medium">QR code</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR code da campanha"
                  className="size-48 rounded-lg border bg-white p-2"
                />
              </div>
            )}

            {isPublic && <ShareButton url={publicUrl} title={campaign.title} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
