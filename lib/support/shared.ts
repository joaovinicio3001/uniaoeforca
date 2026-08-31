import type { Database } from "@/lib/database.types";

export type TicketStatus =
  Database["public"]["Enums"]["support_ticket_status"];
export type TicketCategory =
  Database["public"]["Enums"]["support_ticket_category"];

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "duvida", label: "Dúvida geral" },
  { value: "pagamento", label: "Pagamento / doação" },
  { value: "saque", label: "Saque" },
  { value: "verificacao", label: "Verificação de identidade" },
  { value: "campanha", label: "Minha campanha" },
  { value: "denuncia", label: "Denúncia" },
  { value: "outro", label: "Outro" },
];

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Aberto",
  waiting_user: "Aguardando você",
  resolved: "Resolvido",
  closed: "Fechado",
};

export const TICKET_CATEGORY_LABEL: Record<TicketCategory, string> =
  Object.fromEntries(
    TICKET_CATEGORIES.map((c) => [c.value, c.label]),
  ) as Record<TicketCategory, string>;
