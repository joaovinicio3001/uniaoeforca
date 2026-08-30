import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { allowedTransitions, type CampaignStatus } from "@/lib/campaigns/state-machine";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";
import {
  approveCampaignAction,
  rejectCampaignAction,
  blockCampaignAction,
  unblockCampaignAction,
  resolveReportAction,
} from "../actions";

export const metadata: Metadata = { title: "Revisar campanha" };

export default async function AdminCampanhaReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const admin = createAdminClient();

  const { data: c } = await admin
    .from("campaigns")
    .select("*, categories(name)")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const [{ data: ownerProfile }, { data: media }, { data: reports }, { data: events }] =
    await Promise.all([
    admin.from("profiles").select("full_name").eq("id", c.owner_user_id).maybeSingle(),
    admin.from("campaign_media").select("id, public_url").eq("campaign_id", id).order("position"),
    admin
      .from("reports")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("campaign_moderation_events")
      .select("id, from_status, to_status, reason, created_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const status = c.status as CampaignStatus;
  const staffNext = allowedTransitions(status, "staff");
  const owner = ownerProfile?.full_name ?? "—";
  const openReports = (reports ?? []).filter(
    (r) => r.status === "open" || r.status === "reviewing",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{c.title}</h1>
            <CampaignStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            por {owner} · meta {formatBRL(c.goal_amount_cents)} · criada{" "}
            {formatDateTimeBR(c.created_at)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/campanhas/${c.slug}`} target="_blank">
            <ExternalLink className="size-4" /> Página pública
          </Link>
        </Button>
      </div>

      {ok && (
        <Alert variant="success">
          <AlertDescription>Ação registrada ({ok}).</AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>
            {erro === "motivo-obrigatorio"
              ? "Informe um motivo (mín. 5 caracteres)."
              : decodeURIComponent(erro)}
          </AlertDescription>
        </Alert>
      )}

      {/* Ações de moderação */}
      <Card>
        <CardHeader>
          <CardTitle>Decisão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {staffNext.includes("active") && (
            <form action={approveCampaignAction} className="flex gap-2">
              <input type="hidden" name="campaignId" value={id} />
              <Button type="submit" variant="success" size="sm">
                {status === "blocked" ? "Desbloquear" : "Aprovar e publicar"}
              </Button>
            </form>
          )}
          {staffNext.includes("rejected") && (
            <form action={rejectCampaignAction} className="space-y-2">
              <input type="hidden" name="campaignId" value={id} />
              <textarea
                name="reason"
                required
                rows={2}
                placeholder="Motivo da reprovação (visível ao criador)"
                className="w-full rounded-md border border-input bg-card p-2 text-sm"
              />
              <Button type="submit" variant="destructive" size="sm">
                Reprovar
              </Button>
            </form>
          )}
          {staffNext.includes("blocked") && (
            <form action={blockCampaignAction} className="space-y-2">
              <input type="hidden" name="campaignId" value={id} />
              <textarea
                name="reason"
                required
                rows={2}
                placeholder="Motivo do bloqueio"
                className="w-full rounded-md border border-input bg-card p-2 text-sm"
              />
              <Button type="submit" variant="destructive" size="sm">
                Bloquear
              </Button>
            </form>
          )}
          {status === "blocked" && (
            <form action={unblockCampaignAction}>
              <input type="hidden" name="campaignId" value={id} />
              <Button type="submit" variant="outline" size="sm">
                Reativar campanha
              </Button>
            </form>
          )}
          {staffNext.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma ação de moderação disponível para o status atual.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Denúncias */}
      {reports && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Denúncias ({openReports.length} abertas)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{r.reason}</span>
                  <span className="text-muted-foreground">
                    {formatDateTimeBR(r.created_at)} · {r.status}
                  </span>
                </div>
                {r.details && <p className="mt-1 text-muted-foreground">{r.details}</p>}
                {(r.status === "open" || r.status === "reviewing") && (
                  <form action={resolveReportAction} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="reportId" value={r.id} />
                    <input type="hidden" name="campaignId" value={id} />
                    <input
                      name="note"
                      placeholder="Nota (opcional)"
                      className="h-8 flex-1 rounded border border-input bg-card px-2 text-xs"
                    />
                    <Button type="submit" name="decision" value="actioned" size="sm" variant="outline">
                      Procede
                    </Button>
                    <Button type="submit" name="decision" value="dismissed" size="sm" variant="ghost">
                      Descartar
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            <strong>Resumo:</strong> {c.summary}
          </p>
          {media && media.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {media.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.public_url}
                  alt=""
                  className="aspect-square w-full rounded-md object-cover"
                />
              ))}
            </div>
          )}
          <div
            className="rich-text max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: c.story || "<p>(sem história)</p>" }}
          />
        </CardContent>
      </Card>

      {events && events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de moderação</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {events.map((e) => (
                <li key={e.id}>
                  <span className="text-foreground">
                    {e.from_status ?? "—"} → {e.to_status}
                  </span>
                  {e.reason && ` · ${e.reason}`} · {formatDateTimeBR(e.created_at)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
