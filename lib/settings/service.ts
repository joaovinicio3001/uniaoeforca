import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";

export type AppSetting = {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
};

/** Todas as configurações, uma vez por request. */
export const getAllSettings = cache(async function getAllSettings(): Promise<
  Map<string, AppSetting>
> {
  if (!hasServiceRole()) return new Map();
  const { data } = await createAdminClient()
    .from("app_settings")
    .select("key, value, description, updated_at")
    .order("key");
  return new Map((data ?? []).map((r) => [r.key, r as AppSetting]));
});

/** Valor de uma configuração com fallback tipado. */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const all = await getAllSettings();
  const row = all.get(key);
  if (!row || row.value == null) return fallback;
  return row.value as T;
}

export async function getNumberSetting(
  key: string,
  fallback: number,
): Promise<number> {
  const v = await getSetting<unknown>(key, fallback);
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

export async function getBoolSetting(
  key: string,
  fallback: boolean,
): Promise<boolean> {
  const v = await getSetting<unknown>(key, fallback);
  return typeof v === "boolean" ? v : fallback;
}

/** Grava uma configuração (upsert). */
export async function setSetting(
  key: string,
  value: unknown,
  actorId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!hasServiceRole()) return { ok: false, error: "service_role ausente." };
  const { error } = await createAdminClient()
    .from("app_settings")
    .upsert(
      {
        key,
        value: value as never,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  return error ? { ok: false, error: error.message } : { ok: true };
}
