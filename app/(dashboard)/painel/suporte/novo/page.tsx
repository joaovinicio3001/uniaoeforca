import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { TICKET_CATEGORIES } from "@/lib/support/shared";
import { SectionCard } from "@/components/dashboard/ui";
import { TicketForm } from "./ticket-form";

export const metadata: Metadata = { title: "Abrir chamado" };

export default async function NovoChamadoPage() {
  await requireUser("/painel/suporte/novo");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/painel/suporte"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6B88] hover:text-[#0645D8]"
      >
        <ArrowLeft className="size-4" /> Voltar para suporte
      </Link>

      <div>
        <h1 className="text-[26px] font-bold text-[#071D4A] sm:text-[30px]">
          Abrir chamado
        </h1>
        <p className="mt-1 text-[15px] text-[#5B6B88]">
          Descreva o problema com o máximo de detalhes. A equipe responde por
          aqui e você recebe uma notificação.
        </p>
      </div>

      <SectionCard title="Novo chamado">
        <TicketForm categories={TICKET_CATEGORIES} />
      </SectionCard>
    </div>
  );
}
