import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getUserDossier } from "@/lib/admin/users";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";
import { WithdrawalStatusBadge } from "@/components/withdrawals/status-badge";
import { setAccountStatusAction } from "../actions";

export const metadata: Metadata = { title: "Ficha do usuário" };

export default async function AdminUsuarioDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const d = await getUserDossier(id);
  if (!d) notFound();

  const canManage = can(staff.roles, "users:manage");
  const blocked = d.profile.status === "blocked";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/usuarios">
          <ArrowLeft className="size-4" /> Usuários
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">
          {d.profile.full_name || d.profile.display_name || "Usuário"}
        </h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            blocked
              ? "bg-destructive/15 text-destructive"
              : "bg-success/15 text-success"
          }`}
        >
          {blocked ? "Conta bloqueada" : "Conta ativa"}
        </span>
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

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Info label="E-mail" value={d.email ?? "—"} />
          <Info
            label="E-mail confirmado"
            value={
              d.auth.email_confirmed_at
                ? formatDateTimeBR(d.auth.email_confirmed_at)
                : "não"
            }
          />
          <Info
            label="CPF"
            value={d.profile.cpf_last3 ? `•••.${d.profile.cpf_last3}` : "—"}
          />
          <Info
            label="Nascimento"
            value={
              d.profile.birth_date
                ? new Date(d.profile.birth_date).toLocaleDateString("pt-BR")
                : "—"
            }
          />
          <Info label="Telefone" value={d.profile.phone ?? "—"} />
          <Info
            label="Cidade/UF"
            value={
              [d.profile.address_city, d.profile.address_state]
                .filter(Boolean)
                .join(" / ") || "—"
            }
          />
          <Info label="Papéis" value={d.roles.join(", ") || "—"} />
          <Info
            label="Termos aceitos em"
            value={
              d.profile.terms_accepted_at
                ? formatDateTimeBR(d.profile.terms_accepted_at)
                : "—"
            }
          />
          <Info label="Cadastro" value={formatDateTimeBR(d.profile.created_at)} />
          <Info
            label="Último acesso"
            value={
              d.auth.last_sign_in_at
                ? formatDateTimeBR(d.auth.last_sign_in_at)
                : "—"
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Carteira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {d.wallet ? (
              <>
                <Row label="Disponível" value={formatBRL(d.wallet.available_cents)} />
                <Row label="Pendente" value={formatBRL(d.wallet.pending_cents)} />
                <Row label="Reservado" value={formatBRL(d.wallet.reserved_cents)} />
                <Row label="Retido" value={formatBRL(d.wallet.held_cents)} />
                <Row label="Já sacado" value={formatBRL(d.wallet.withdrawn_cents)} />
              </>
            ) : (
              <p className="text-muted-foreground">Sem carteira.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Contribuições feitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Doações pagas" value={String(d.donations.count)} />
            <Row
              label="Total doado"
              value={formatBRL(d.donations.totalGrossCents)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campanhas ({d.campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {d.campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma campanha.</p>
          ) : (
            <ul className="divide-y text-sm">
              {d.campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <Link
                    href={`/admin/campanhas/${c.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.title}
                  </Link>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {formatBRL(c.raised_amount_cents)} /{" "}
                    {formatBRL(c.goal_amount_cents)}
                    <CampaignStatusBadge status={c.status as never} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saques ({d.withdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {d.withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum saque.</p>
          ) : (
            <ul className="divide-y text-sm">
              {d.withdrawals.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <Link
                    href={`/admin/saques/${w.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {formatBRL(w.amount_cents)}
                  </Link>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    líquido {formatBRL(w.net_cents)} ·{" "}
                    {formatDateTimeBR(w.requested_at)}
                    <WithdrawalStatusBadge status={w.status as never} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verificação (KYC)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {d.kyc ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Info label="Nível" value={d.kyc.level} />
              <Info label="Status" value={d.kyc.status} />
              <Info
                label="Enviado em"
                value={
                  d.kyc.submitted_at
                    ? formatDateTimeBR(d.kyc.submitted_at)
                    : "—"
                }
              />
              <Info
                label="Revisado em"
                value={
                  d.kyc.reviewed_at ? formatDateTimeBR(d.kyc.reviewed_at) : "—"
                }
              />
              {d.kyc.rejection_reason && (
                <Info label="Motivo da recusa" value={d.kyc.rejection_reason} />
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma verificação iniciada.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aceites legais</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {d.legal.length === 0 ? (
            <p className="text-muted-foreground">Nenhum aceite registrado.</p>
          ) : (
            <ul className="divide-y">
              {d.legal.map((l, i) => (
                <li key={i} className="flex justify-between gap-2 py-1.5">
                  <span className="capitalize">
                    {l.document.replace("_", " ")}
                  </span>
                  <span className="text-muted-foreground">
                    v{l.version} · {formatDateTimeBR(l.accepted_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Ações administrativas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações administrativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!canManage ? (
            <p className="text-sm text-muted-foreground">
              Exige o papel de <strong>admin</strong>.
            </p>
          ) : blocked ? (
            <form action={setAccountStatusAction}>
              <input type="hidden" name="userId" value={id} />
              <input type="hidden" name="action" value="unblock" />
              <Button type="submit" variant="outline" size="sm">
                Desbloquear conta
              </Button>
            </form>
          ) : (
            <form action={setAccountStatusAction} className="space-y-2">
              <input type="hidden" name="userId" value={id} />
              <input type="hidden" name="action" value="block" />
              <textarea
                name="reason"
                required
                rows={2}
                placeholder="Motivo do bloqueio (registrado na auditoria)"
                className="w-full rounded-md border border-input bg-card p-2 text-sm"
              />
              <Button type="submit" variant="destructive" size="sm">
                Bloquear conta
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground">
            O bloqueio impede novo login e encerra a sessão no próximo refresh de
            token.
          </p>
        </CardContent>
      </Card>

      {d.audit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {d.audit.map((e, i) => (
                <li key={i}>
                  <span className="text-foreground">{e.action}</span> ·{" "}
                  {e.entity_type} · {formatDateTimeBR(e.created_at)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}
