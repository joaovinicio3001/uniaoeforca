import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";

/** Cria uma notificação in-app para um usuário. Best-effort. */
export async function notifyUser(
  userId: string,
  type: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    await createAdminClient()
      .from("notifications")
      .insert({ user_id: userId, type, payload: payload as never });
  } catch {
    /* ignore */
  }
}

/**
 * Envia a mesma notificação para vários usuários (aviso da equipe). Faz
 * fan-out: uma linha por usuário — a plataforma é pequena e assim a leitura
 * (contador de não lidas, marcar como lida) fica trivial e por-usuário.
 */
export async function notifyManyUsers(
  userIds: string[],
  type: string,
  payload: Record<string, unknown> = {},
): Promise<number> {
  if (!hasServiceRole() || userIds.length === 0) return 0;
  const rows = userIds.map((id) => ({
    user_id: id,
    type,
    payload: payload as never,
  }));
  const { error, count } = await createAdminClient()
    .from("notifications")
    .insert(rows, { count: "exact" });
  return error ? 0 : (count ?? rows.length);
}

/** Ids de todos os usuários (para broadcast da equipe). */
export async function allUserIds(): Promise<string[]> {
  if (!hasServiceRole()) return [];
  const { data } = await createAdminClient().from("profiles").select("id");
  return (data ?? []).map((r) => r.id);
}
