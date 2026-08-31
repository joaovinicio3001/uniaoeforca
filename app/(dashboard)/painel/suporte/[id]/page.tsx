import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getMyTicket } from "@/lib/support/service";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_LABEL,
} from "@/lib/support/shared";
import { formatDateTimeBR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CARD, SectionCard } from "@/components/dashboard/ui";
import { replyTicketAction } from "../actions";

export const metadata: Metadata = { title: "Chamado" };

export default async function ChamadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const user = await requireUser(`/painel/suporte/${id}`);
  const data = await getMyTicket(user.id, id);
  if (!data) notFound();

  const { ticket, messages } = data;
  const closed = ticket.status === "closed";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/painel/suporte"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6B88] hover:text-[#0645D8]"
      >
        <ArrowLeft className="size-4" /> Suporte
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[22px] font-bold text-[#071D4A]">{ticket.subject}</h1>
        <span className="rounded-full bg-[#EAF1FF] px-2.5 py-1 text-xs font-medium text-[#0645D8]">
          {TICKET_STATUS_LABEL[ticket.status]}
        </span>
      </div>
      <p className="-mt-3 text-[13px] text-[#5B6B88]">
        {TICKET_CATEGORY_LABEL[ticket.category]} · aberto em{" "}
        {formatDateTimeBR(ticket.created_at)}
      </p>

      {erro && (
        <div className="rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]">
          {erro === "limite"
            ? "Você enviou muitas mensagens. Aguarde um pouco."
            : "Não foi possível enviar a mensagem."}
        </div>
      )}

      <div className={cn(CARD, "space-y-3 p-4")}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
              m.is_staff
                ? "bg-[#EDF4FF] text-[#1B3A70]"
                : "ml-auto bg-[#F2F5F9] text-[#071D4A]",
            )}
          >
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p className="mt-1 text-[11px] text-[#7A879E]">
              {m.is_staff ? "Equipe União & Força" : "Você"} ·{" "}
              {formatDateTimeBR(m.created_at)}
            </p>
          </div>
        ))}
      </div>

      {closed ? (
        <p className="text-sm text-[#5B6B88]">
          Este chamado foi fechado. Abra um novo se precisar de mais ajuda.
        </p>
      ) : (
        <SectionCard title="Responder">
          <form action={replyTicketAction} className="space-y-3">
            <input type="hidden" name="ticketId" value={id} />
            <textarea
              name="body"
              required
              rows={4}
              placeholder="Escreva sua mensagem…"
              className="w-full rounded-[11px] border border-[#DFE7F2] bg-white px-3.5 py-2.5 text-[15px] text-[#071D4A] outline-none focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]"
            />
            <button
              type="submit"
              className="h-11 rounded-[11px] bg-[#0645D8] px-5 text-[15px] font-semibold text-white hover:bg-[#0B4FE5]"
            >
              Enviar
            </button>
          </form>
        </SectionCard>
      )}
    </div>
  );
}
