-- Fase 0 — move os helpers de RBAC para o schema `private`, que o PostgREST
-- não expõe. Elimina o warning "authenticated pode executar função SECURITY
-- DEFINER via /rest/v1/rpc". As policies de RLS continuam podendo chamá-los.

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create or replace function private.has_role(uid uuid, target public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = uid and role = target);
$$;

create or replace function private.is_staff(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid and role in ('analista','financeiro','admin','superadmin')
  );
$$;

create or replace function private.is_superadmin(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = uid and role = 'superadmin');
$$;

-- Repointar as policies para as versões em `private`.
drop policy if exists profiles_select_staff on public.profiles;
create policy profiles_select_staff on public.profiles
  for select to authenticated using (private.is_staff(auth.uid()));

drop policy if exists user_roles_select_staff on public.user_roles;
create policy user_roles_select_staff on public.user_roles
  for select to authenticated using (private.is_staff(auth.uid()));

drop policy if exists audit_logs_select_staff on public.audit_logs;
create policy audit_logs_select_staff on public.audit_logs
  for select to authenticated using (private.is_staff(auth.uid()));

-- Remover as versões públicas agora sem uso.
drop function if exists public.has_role(uuid, public.app_role);
drop function if exists public.is_staff(uuid);
drop function if exists public.is_superadmin(uuid);
