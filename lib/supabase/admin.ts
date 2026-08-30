import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Client com service_role — IGNORA RLS. Use com extrema parcimônia e SOMENTE
 * no servidor, para operações que precisam de privilégio (escrita de audit_logs,
 * concessão de papéis, jobs financeiros das fases seguintes).
 *
 * Regra da doc §34.7: a service_role key nunca deve ir ao browser.
 * O import "server-only" acima quebra o build se algum client component importar isto.
 */
export function createAdminClient() {
  const key = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Necessária para operações privilegiadas. " +
        "Pegue em Supabase Dashboard > Project Settings > API.",
    );
  }
  return createSupabaseClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
