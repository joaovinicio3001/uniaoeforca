import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/session";
import { hasServiceRole } from "@/lib/env";
import { listAllTickets } from "@/lib/support/service";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_LABEL,
  type TicketStatus,
} from "@/lib/support/shared";
import { formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Suporte" };

const FILTERS: { key: string; label: string; status?: TicketStatus }[] = [
  { key: "abertos", label: "Abertos", status: "open" },
  { key: "aguardando", label: "Aguardando usuário", status: "waiting_user" },
  { key: "resolvidos", label: "Resolvidos", status: "resolved" },
  { key: "fechados", label: "Fechados", status: "closed" },
  { key: "todos", label: "Todos" },
];

export default async function AdminSuportePage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  await requireStaff();
  const { f = "abertos" } = await searchParams;

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Suporte</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const active = FILTERS.find((x) => x.key === f) ?? FILTERS[0]!;
  const tickets = await listAllTickets(active.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">Chamados abertos pelos usuários.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={`/admin/suporte?f=${x.key}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              x.key === active.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {x.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{active.label} ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada por aqui.</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Assunto</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Última mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/40">
                    <td className="py-2 pr-2">
                      <Link
                        href={`/admin/suporte/${t.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.subject}
                      </Link>
                    </td>
                    <td className="pr-2 text-muted-foreground">
                      {TICKET_CATEGORY_LABEL[t.category]}
                    </td>
                    <td className="pr-2">{TICKET_STATUS_LABEL[t.status]}</td>
                    <td className="text-muted-foreground">
                      {formatDateTimeBR(t.last_message_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
