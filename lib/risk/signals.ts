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

    await checkMultiAccountIp(userId, hash);
  } catch {
    /* ignore */
  }
}

/** Quantas contas distintas quando esse IP passa do limite = sinal de multi-conta. */
const MULTI_ACCOUNT_IP_THRESHOLD = 3;

async function checkMultiAccountIp(
  userId: string,
  ipHashValue: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("account_ip_signals")
    .select("user_id")
    .eq("ip_hash", ipHashValue)
    .limit(50);

  const users = new Set((rows ?? []).map((r) => r.user_id));
  if (users.size < MULTI_ACCOUNT_IP_THRESHOLD) return;

  // Não repete o flag se já há um aberto para este usuário nos últimos 7 dias.
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data: existing } = await admin
    .from("risk_flags")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "multi_account_ip")
    .in("status", ["open", "reviewing"])
    .gte("created_at", weekAgo)
    .limit(1);
  if (existing && existing.length > 0) return;

  await admin.from("risk_flags").insert({
    type: "multi_account_ip",
    severity: "warning",
    user_id: userId,
    details: { shared_accounts: users.size },
  });
  await notifyRiskStaff(
    `${users.size} contas compartilham o mesmo IP`,
    "/admin/risco",
  );
}

/** Registra um sinal de risco genérico + avisa a equipe. Best-effort. */
export async function raiseRiskFlag(params: {
  type: "manual" | "multi_account_pix" | "multi_account_cpf";
  userId: string;
  campaignId?: string | null;
  severity?: "info" | "warning" | "critical";
  details?: Record<string, unknown>;
  summary: string;
}): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    const admin = createAdminClient();
    await admin.from("risk_flags").insert({
      type: params.type,
      severity: params.severity ?? "warning",
      user_id: params.userId,
      campaign_id: params.campaignId ?? null,
      details: (params.details ?? {}) as never,
    });
    await notifyRiskStaff(params.summary, "/admin/risco");
  } catch {
    /* ignore */
  }
}

async function notifyRiskStaff(summary: string, href: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: staff } = await admin
      .from("user_roles")
      .select("user_id")
      .in("role", ["analista", "financeiro", "admin", "superadmin"]);
    const ids = [...new Set((staff ?? []).map((s) => s.user_id))];
    if (ids.length === 0) return;
    await admin.from("notifications").insert(
      ids.map((id) => ({
        user_id: id,
        type: "admin_message",
        payload: {
          title: "Sinal de risco",
          body: summary,
          href,
        } as never,
      })),
    );
  } catch {
    /* ignore */
  }
}
