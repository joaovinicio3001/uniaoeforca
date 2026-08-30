import "server-only";

import { headers } from "next/headers";
import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv, hasServiceRole } from "@/lib/env";

/** IP do request (por trás de proxy/Cloudflare). */
export async function requestIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export function ipHash(ip: string): string {
  const pepper = serverEnv().CPF_HASH_PEPPER;
  return createHash("sha256").update(`ip:${pepper}:${ip}`).digest("hex");
}

/**
 * Registra o IP do usuário para detecção de múltiplas contas (doc §14).
 * Best-effort — nunca derruba o fluxo principal.
 */
export async function recordIpSignal(userId: string): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    const ip = await requestIp();
    if (ip === "unknown") return;
    const admin = createAdminClient();
    const hash = ipHash(ip);
    const now = new Date().toISOString();
    const { error } = await admin
      .from("account_ip_signals")
      .update({ last_seen_at: now })
      .eq("user_id", userId)
      .eq("ip_hash", hash);
    if (error) return;
    // insert se ainda não existia
    await admin
      .from("account_ip_signals")
      .insert({ user_id: userId, ip_hash: hash })
      .then(
        () => undefined,
        () => undefined, // conflito = já existe, ok
      );
  } catch {
    /* ignore */
  }
}
