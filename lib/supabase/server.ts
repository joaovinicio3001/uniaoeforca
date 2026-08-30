import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Client do Supabase para Server Components, Route Handlers e Server Actions.
 * Lê/escreve a sessão via cookies. Continua sujeito a RLS (usa a anon key +
 * o JWT do usuário logado).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` chamado de um Server Component — ok ignorar quando há
            // middleware cuidando da renovação da sessão.
          }
        },
      },
    },
  );
}
