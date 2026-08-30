import "server-only";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";

/**
 * Trilha de auditoria (doc §13.2 / §28: "Aprovação administrativa fica auditada").
 * Toda ação administrativa/financeira sensível deve gerar um registro imutável
 * com quem fez, o quê, quando, de onde e o antes/depois.
 *
 * Escreve via service_role porque `audit_logs` não aceita INSERT do cliente (RLS).
 */
export type AuditInput = {
  actorUserId: string | null;
  action: string; // ex.: "auth.login", "withdrawal.approve"
  entityType: string; // ex.: "withdrawal"
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  if (!hasServiceRole()) {
    // Em dev sem service_role, não derruba o fluxo — só avisa.
    console.warn(
      `[audit] ignorado (sem SUPABASE_SERVICE_ROLE_KEY): ${input.action} ${input.entityType}`,
    );
    return;
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent") ?? null;

  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_json: (input.before ?? null) as never,
    after_json: (input.after ?? null) as never,
    ip,
    user_agent: userAgent,
  });

  if (error) {
    // Auditoria não deve mascarar a operação principal, mas precisa ser vista.
    console.error("[audit] falha ao gravar:", error.message);
  }
}
