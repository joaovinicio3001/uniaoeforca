import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { getTicketForStaff } from "@/lib/support/service";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_LABEL,
} from "@/lib/support/shared";
import { formatDateTimeBR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { staffReplyAction, staffSetStatusAction } from "../actions";

export const metadata: Metadata = { title: "Chamado" };

export default async function AdminChamadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const data = await getTicketForStaff(id);
  if (!data) notFound();

  const { ticket, messages, requester } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/suporte">
          <ArrowLeft className="size-4" /> Chamados
        </Link>
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {TICKET_STATUS_LABEL[ticket.status]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {requester.name} · {requester.email ?? "—"} ·{" "}
          {TICKET_CATEGORY_LABEL[ticket.category]} · aberto em{" "}
          {formatDateTimeBR(ticket.created_at)}
        </p>
      </div>

      {ok && (
        <Alert variant="success">
          <AlertDescription>Ação registrada.</AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível concluir a ação.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conversa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.is_staff
                  ? "ml-auto bg-primary/10 text-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {m.is_staff ? "Equipe" : requester.name} ·{" "}
                {formatDateTimeBR(m.created_at)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={staffReplyAction} className="space-y-3">
            <input type="hidden" name="ticketId" value={id} />
            <textarea
              name="body"
              required
              rows={4}
              placeholder="Resposta ao usuário…"
              className="w-full rounded-md border border-input bg-card p-2 text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-muted-foreground">
                Status após enviar:
              </label>
              <select
                name="status"
                defaultValue="waiting_user"
                className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              >
                <option value="waiting_user">Aguardando usuário</option>
                <option value="open">Aberto</option>
                <option value="resolved">Resolvido</option>
              </select>
              <Button type="submit" size="sm">
                Enviar resposta
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 border-t pt-3">
            {(["resolved", "closed", "open"] as const).map((s) => (
              <form key={s} action={staffSetStatusAction}>
                <input type="hidden" name="ticketId" value={id} />
                <input type="hidden" name="status" value={s} />
                <Button type="submit" size="sm" variant="outline">
                  Marcar como {TICKET_STATUS_LABEL[s].toLowerCase()}
                </Button>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
