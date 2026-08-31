import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  type AppRole,
  type Permission,
  can,
  canAccessArea,
  highestRole,
  isStaff,
} from "@/lib/auth/rbac";

export type SessionUser = {
  id: string;
  email: string | null;
  roles: AppRole[];
  displayName: string | null;
  fullName: string | null;
  profileStatus: string | null;
};

/** Retorna o usuário logado + papéis + perfil, ou null se não autenticado. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("display_name, full_name, status")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return {
    id: user.id,
    email: user.email ?? null,
    roles: (roleRows ?? []).map((r) => r.role as AppRole),
    displayName: profile?.display_name ?? null,
    fullName: profile?.full_name ?? null,
    profileStatus: profile?.status ?? null,
  };
}

/** Exige autenticação; redireciona para /login preservando o destino. */
export async function requireUser(redirectTo = "/painel"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (user.profileStatus === "blocked") {
    redirect("/conta-bloqueada");
  }
  return user;
}

/** Exige acesso à área administrativa (staff). */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!canAccessArea(user.roles, "admin")) {
    redirect("/painel?erro=sem-permissao");
  }
  return user;
}

/** Exige uma permissão fina específica. */
export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.roles, permission)) {
    redirect("/painel?erro=sem-permissao");
  }
  return user;
}

export { isStaff, highestRole };
