import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";
import { canAccessArea, type AppRole } from "@/lib/auth/rbac";

/**
 * Renova a sessão do Supabase a cada request e aplica as guardas de rota:
 *   /painel/*  -> exige usuário autenticado
 *   /admin/*   -> exige papel de staff (analista | financeiro | admin | superadmin)
 *
 * IMPORTANTE (doc §34.7): RLS não substitui autorização server-side. A guarda
 * aqui é a primeira camada; cada rota/mutação ainda revalida no servidor.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith("/painel") || path.startsWith("/admin");

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && path.startsWith("/admin")) {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);
    if (!canAccessArea(roles, "admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/painel";
      url.searchParams.set("erro", "sem-permissao");
      return NextResponse.redirect(url);
    }
  }

  return response;
}
