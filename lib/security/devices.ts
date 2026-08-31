import "server-only";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";

/** Extrai a claim `session_id` de um access token do Supabase (sem verificar). */
export function sessionIdFromJwt(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null;
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as {
      session_id?: unknown;
    };
    return typeof json.session_id === "string" ? json.session_id : null;
  } catch {
    return null;
  }
}

/** Session id da requisição atual (cookie de sessão). */
export async function currentSessionId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return sessionIdFromJwt(session?.access_token);
}

async function requestIp(): Promise<string | null> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  return ip && ip !== "unknown" ? ip : null;
}

/**
 * Registra o dispositivo do login atual (User-Agent + IP reais do navegador,
 * pois esta função roda numa server action disparada direto pelo cliente).
 * Best-effort — nunca derruba o login.
 */
export async function recordLoginDevice(
  userId: string,
  accessToken: string | null | undefined,
): Promise<void> {
  if (!hasServiceRole()) return;
  const sessionId = sessionIdFromJwt(accessToken);
  if (!sessionId) return;
  try {
    const h = await headers();
    const admin = createAdminClient();
    const now = new Date().toISOString();
    await admin.from("user_devices").upsert(
      {
        user_id: userId,
        auth_session_id: sessionId,
        user_agent: h.get("user-agent")?.slice(0, 400) ?? null,
        ip: await requestIp(),
        last_seen_at: now,
      },
      { onConflict: "user_id,auth_session_id" },
    );
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ *
 * Parsing de User-Agent (leve, sem dependência)
 * ------------------------------------------------------------------ */
export function parseUserAgent(ua: string | null): {
  device: string;
  os: string;
  browser: string;
  isMobile: boolean;
} {
  const s = ua ?? "";
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(s);

  let os = "Sistema desconhecido";
  if (/Windows NT/i.test(s)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/Mac OS X/i.test(s)) os = "macOS";
  else if (/Linux/i.test(s)) os = "Linux";
  else if (/CrOS/i.test(s)) os = "ChromeOS";

  let browser = "Navegador";
  if (/Edg\//i.test(s)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera";
  else if (/SamsungBrowser/i.test(s)) browser = "Samsung Internet";
  else if (/Firefox\//i.test(s)) browser = "Firefox";
  else if (/Chrome\//i.test(s)) browser = "Chrome";
  else if (/Safari\//i.test(s)) browser = "Safari";
  else if (/Vercel|Next\.js|node/i.test(s)) browser = "Servidor";

  return { device: `${os} · ${browser}`, os, browser, isMobile };
}

/** Mascara os 2 últimos octetos de um IPv4 (ex.: 200.12.xxx.xxx). */
export function maskIp(ip: string | null): string {
  if (!ip) return "—";
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (v4) return `${v4[1]}.${v4[2]}.xxx.xxx`;
  if (ip.includes(":")) {
    const head = ip.split(":").slice(0, 2).join(":");
    return `${head}:xxxx:xxxx`;
  }
  return ip;
}

export type DeviceView = {
  sessionId: string;
  device: string;
  os: string;
  isMobile: boolean;
  ipMasked: string;
  lastSeenAt: string | null;
  createdAt: string;
  isCurrent: boolean;
};

/**
 * Dispositivos do usuário logado. Cruza `user_devices` (UA/IP reais do login)
 * com as sessões ainda vivas em `auth.sessions` (para "último acesso" e para
 * descartar sessões já expiradas/revogadas).
 */
export async function listMyDevices(): Promise<DeviceView[]> {
  if (!hasServiceRole()) return [];
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return [];

  const current = await currentSessionId();
  const admin = createAdminClient();

  const [{ data: devices }, { data: sessions }] = await Promise.all([
    admin
      .from("user_devices")
      .select("auth_session_id, user_agent, ip, created_at, last_seen_at")
      .eq("user_id", user.id),
    admin.rpc("sec_list_user_sessions", { p_user_id: user.id }),
  ]);

  const liveById = new Map(
    (sessions ?? []).map((s) => [s.session_id, s]),
  );

  // Sessões vivas que ainda não têm registro de dispositivo (ex.: login antes
  // desta feature) aparecem com dados genéricos.
  const rows: DeviceView[] = [];
  const seen = new Set<string>();

  for (const d of devices ?? []) {
    const live = liveById.get(d.auth_session_id);
    if (!live) continue; // sessão encerrada/expirada
    seen.add(d.auth_session_id);
    const p = parseUserAgent(d.user_agent);
    rows.push({
      sessionId: d.auth_session_id,
      device: p.device,
      os: p.os,
      isMobile: p.isMobile,
      ipMasked:
        d.auth_session_id === current
          ? (d.ip ?? "—")
          : maskIp(d.ip),
      lastSeenAt: live.refreshed_at ?? d.last_seen_at,
      createdAt: d.created_at,
      isCurrent: d.auth_session_id === current,
    });
  }

  for (const s of sessions ?? []) {
    if (seen.has(s.session_id)) continue;
    rows.push({
      sessionId: s.session_id,
      device: "Dispositivo não identificado",
      os: "—",
      isMobile: false,
      ipMasked: "—",
      lastSeenAt: s.refreshed_at ?? s.created_at,
      createdAt: s.created_at,
      isCurrent: s.session_id === current,
    });
  }

  rows.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? "");
  });
  return rows;
}
