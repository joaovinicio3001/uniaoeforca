import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";

/**
 * Trava de login por tentativas malsucedidas (doc §15). Persistente no banco —
 * sobrevive a reinício de instância, ao contrário do rate limit em memória.
 */
const MAX_FAILS = 6; // dentro da janela
const WINDOW_MINUTES = 15;
const LOCK_MINUTES = 15;

function keyFor(email: string): string {
  return email.trim().toLowerCase();
}

export async function checkLoginLock(
  email: string,
): Promise<{ locked: boolean; retryAfterSeconds: number }> {
  if (!hasServiceRole()) return { locked: false, retryAfterSeconds: 0 };
  const admin = createAdminClient();
  const { data } = await admin
    .from("login_attempts")
    .select("locked_until")
    .eq("identifier", keyFor(email))
    .maybeSingle();

  const until = data?.locked_until ? Date.parse(data.locked_until) : 0;
  if (until > Date.now()) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((until - Date.now()) / 1000),
    };
  }
  return { locked: false, retryAfterSeconds: 0 };
}

export async function registerLoginFailure(email: string): Promise<void> {
  if (!hasServiceRole()) return;
  const admin = createAdminClient();
  const id = keyFor(email);
  const now = Date.now();

  const { data: row } = await admin
    .from("login_attempts")
    .select("fail_count, first_fail_at")
    .eq("identifier", id)
    .maybeSingle();

  const windowStart = now - WINDOW_MINUTES * 60_000;
  const inWindow = row && Date.parse(row.first_fail_at) >= windowStart;
  const nextCount = inWindow ? (row?.fail_count ?? 0) + 1 : 1;
  const lockedUntil =
    nextCount >= MAX_FAILS
      ? new Date(now + LOCK_MINUTES * 60_000).toISOString()
      : null;

  await admin.from("login_attempts").upsert(
    {
      identifier: id,
      fail_count: nextCount,
      first_fail_at: inWindow
        ? (row?.first_fail_at ?? new Date(now).toISOString())
        : new Date(now).toISOString(),
      last_fail_at: new Date(now).toISOString(),
      locked_until: lockedUntil,
    },
    { onConflict: "identifier" },
  );
}

export async function clearLoginFailures(email: string): Promise<void> {
  if (!hasServiceRole()) return;
  await createAdminClient()
    .from("login_attempts")
    .delete()
    .eq("identifier", keyFor(email));
}
