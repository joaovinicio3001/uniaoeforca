import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/campaigns/state-machine";

const MAP: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  pending_review: {
    label: "Em análise",
    className: "bg-accent/20 text-accent-foreground",
  },
  active: { label: "Ativa", className: "bg-success/15 text-success" },
  paused: { label: "Pausada", className: "bg-muted text-muted-foreground" },
  completed: { label: "Concluída", className: "bg-primary/10 text-primary" },
  rejected: {
    label: "Reprovada",
    className: "bg-destructive/10 text-destructive",
  },
  blocked: { label: "Bloqueada", className: "bg-destructive/15 text-destructive" },
  archived: { label: "Arquivada", className: "bg-muted text-muted-foreground" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
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
