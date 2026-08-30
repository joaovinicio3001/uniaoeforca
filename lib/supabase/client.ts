"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Client do Supabase para uso no browser (Client Components).
 * Usa apenas a chave publicável/anon — segura de expor. RLS protege os dados.
 */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
