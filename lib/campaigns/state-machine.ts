import type { Database } from "@/lib/database.types";

export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];

/**
 * Máquina de estados da campanha (doc §7.2):
 *
 *   DRAFT → PENDING_REVIEW → ACTIVE → COMPLETED → ARCHIVED
 *                       ↘ REJECTED
 *   ACTIVE ↔ PAUSED
 *   ACTIVE / PAUSED → BLOCKED (risco, denúncia, fraude, ordem operacional)
 *   REJECTED → DRAFT (dono revisa e reenvia)
 *   BLOCKED → ACTIVE / ARCHIVED (decisão administrativa)
 *
 * `actor` distingue o que o dono pode fazer do que exige staff.
 */
export type Actor = "owner" | "staff";

type Transition = { to: CampaignStatus; by: Actor[] };

const GRAPH: Record<CampaignStatus, Transition[]> = {
  draft: [{ to: "pending_review", by: ["owner", "staff"] }],
  pending_review: [
    { to: "active", by: ["staff"] },
    { to: "rejected", by: ["staff"] },
    { to: "draft", by: ["owner"] }, // desistir da submissão
  ],
  rejected: [{ to: "draft", by: ["owner", "staff"] }],
  active: [
    { to: "paused", by: ["owner", "staff"] },
    { to: "completed", by: ["owner", "staff"] },
    { to: "blocked", by: ["staff"] },
    { to: "archived", by: ["owner", "staff"] },
  ],
  paused: [
    { to: "active", by: ["owner", "staff"] },
    { to: "completed", by: ["owner", "staff"] },
    { to: "blocked", by: ["staff"] },
    { to: "archived", by: ["owner", "staff"] },
  ],
  blocked: [
    { to: "active", by: ["staff"] },
    { to: "archived", by: ["staff"] },
  ],
  completed: [{ to: "archived", by: ["owner", "staff"] }],
  archived: [],
};

export function allowedTransitions(
  from: CampaignStatus,
  actor: Actor,
): CampaignStatus[] {
  return GRAPH[from].filter((t) => t.by.includes(actor)).map((t) => t.to);
}

export function canTransition(
  from: CampaignStatus,
  to: CampaignStatus,
  actor: Actor,
): boolean {
  return GRAPH[from].some((t) => t.to === to && t.by.includes(actor));
}

/** Estados em que o dono ainda pode editar título/história/meta livremente. */
export const OWNER_EDITABLE_STATUSES: CampaignStatus[] = ["draft", "rejected"];

/** Estados visíveis publicamente. */
export const PUBLIC_STATUSES: CampaignStatus[] = ["active", "completed"];

/** O slug fica imutável a partir do momento em que a campanha é publicada. */
export function slugIsLocked(status: CampaignStatus): boolean {
  return !["draft", "pending_review", "rejected"].includes(status);
}
