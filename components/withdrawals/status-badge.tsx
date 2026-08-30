import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type S = Database["public"]["Enums"]["withdrawal_status"];

const MAP: Record<S, { label: string; className: string }> = {
  requested: { label: "Solicitado", className: "bg-muted text-muted-foreground" },
  under_review: { label: "Em análise", className: "bg-accent/20 text-accent-foreground" },
  approved: { label: "Aprovado", className: "bg-primary/10 text-primary" },
  processing: { label: "Processando", className: "bg-accent/20 text-accent-foreground" },
  paid: { label: "Pago", className: "bg-success/15 text-success" },
  rejected: { label: "Rejeitado", className: "bg-destructive/10 text-destructive" },
  failed: { label: "Falhou", className: "bg-destructive/15 text-destructive" },
  canceled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

export function WithdrawalStatusBadge({ status }: { status: S }) {
  const s = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}

export const WITHDRAWAL_STATUS_LABEL: Record<S, string> = Object.fromEntries(
  Object.entries(MAP).map(([k, v]) => [k, v.label]),
) as Record<S, string>;
