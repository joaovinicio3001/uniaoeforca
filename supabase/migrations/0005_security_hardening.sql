-- Fase 0 — hardening apontado pelo linter de segurança do Supabase.
--   1. set_updated_at sem search_path fixo  -> fixar.
--   2. handle_new_user exposto como RPC      -> revogar EXECUTE de todos
--      (trigger não precisa de EXECUTE do papel chamador).
--   3. helpers de RBAC executáveis por anon   -> revogar de anon/public.
--      Mantidos para `authenticated` porque são chamados DENTRO das policies
--      de RLS (SECURITY DEFINER é obrigatório para evitar recursão em user_roles).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_staff(uuid) from public, anon;
revoke all on function public.is_superadmin(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.is_superadmin(uuid) to authenticated;
