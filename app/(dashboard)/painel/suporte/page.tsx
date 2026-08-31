import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Plus } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { listMyTickets, TICKET_STATUS_LABEL } from "@/lib/support/service";
import { formatDateTimeBR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  CARD,
  DashLinkButton,
  EmptyState,
  PageHeader,
} from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Suporte" };

export default async function SuportePage() {
  const user = await requireUser("/painel/suporte");
  const tickets = await listMyTickets(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suporte"
        subtitle="Abra um chamado e acompanhe as respostas da equipe."
        actions={
          <DashLinkButton href="/painel/suporte/novo">
            <Plus className="size-4" /> Abrir chamado
          </DashLinkButton>
        }
      />

      {tickets.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={LifeBuoy}
            title="Nenhum chamado ainda"
            description="Precisa de ajuda? Abra um chamado e a equipe responde por aqui."
          />
        </div>
      ) : (
        <div className={cn(CARD, "divide-y")}>
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/painel/suporte/${t.id}`}
              className="flex items-center justify-between gap-3 p-4 hover:bg-[#F7FAFD]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[#071D4A]">
                  {t.subject}
                </p>
                <p className="text-xs text-[#5B6B88]">
                  {formatDateTimeBR(t.last_message_at)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  t.status === "resolved" || t.status === "closed"
                    ? "bg-[#ECF9F0] text-[#20B85A]"
                    : t.status === "waiting_user"
                      ? "bg-[#FFF8DF] text-[#B7791F]"
                      : "bg-[#EAF1FF] text-[#0645D8]"
                }`}
              >
                {TICKET_STATUS_LABEL[t.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
