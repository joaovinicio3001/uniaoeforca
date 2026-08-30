-- Fase 0 — identidade: perfis, papéis (RBAC) e helpers de autorização.
-- Doc §3 (perfis e permissões), §6.1 (cadastro), §18 (modelo de dados).

-- ------------------------------------------------------------------
-- Enum de papéis. "visitante" é implícito (não autenticado) e NÃO entra aqui.
-- ------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'doador',
      'criador',
      'analista',
      'financeiro',
      'admin',
      'superadmin'
    );
  end if;
end
$$;

-- ------------------------------------------------------------------
-- profiles: dados cadastrais do usuário. A fonte de verdade do e-mail e do
-- estado de verificação é auth.users (Supabase Auth); aqui ficam os demais
-- campos do cadastro (doc §6.1).
--
-- CPF: NUNCA em claro. Guardamos hash (dedup/consulta) + últimos 3 dígitos
-- (suporte). O valor cifrado completo (cpf_encrypted) é populado no fluxo de
-- KYC (Fase 5) usando chave do Vault — coluna criada aqui para o schema já
-- prever isso (doc §18 "cpf_hash/encrypted").
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text not null,
  display_name      text,
  cpf_hash          text unique,
  cpf_last3         text,
  cpf_encrypted     bytea,
  birth_date        date,
  phone             text,
  cep               text,
  address_street    text,
  address_number    text,
  address_complement text,
  address_district  text,
  address_city      text,
  address_state     char(2),
  status            text not null default 'active'
                      check (status in ('active', 'pending', 'blocked')),
  marketing_opt_in  boolean not null default false,
  terms_accepted_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is 'Cadastro do usuário (doc §6.1). E-mail/verificação vivem em auth.users.';
comment on column public.profiles.cpf_hash is 'Hash do CPF para dedup. Substituir por tokenização do PSP na Fase 5.';
comment on column public.profiles.cpf_encrypted is 'CPF cifrado (Vault) — populado no KYC (Fase 5).';

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- user_roles: papéis atribuídos. Um usuário pode ter mais de um.
-- Escrita só por service_role / funções SECURITY DEFINER (sem policy de write).
-- ------------------------------------------------------------------
create table if not exists public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is 'RBAC (doc §3). Escrita apenas server-side privilegiado.';

create index if not exists idx_user_roles_role on public.user_roles (role);

-- ------------------------------------------------------------------
-- Helpers de autorização. SECURITY DEFINER + search_path fixo para poderem ser
-- usados dentro de policies de RLS sem recursão.
-- ------------------------------------------------------------------
create or replace function public.has_role(uid uuid, target public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid and role = target
  );
$$;

create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid
      and role in ('analista', 'financeiro', 'admin', 'superadmin')
  );
$$;

create or replace function public.is_superadmin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid and role = 'superadmin'
  );
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.is_staff(uuid) from public;
revoke all on function public.is_superadmin(uuid) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;
grant execute on function public.is_staff(uuid) to authenticated, anon;
grant execute on function public.is_superadmin(uuid) to authenticated, anon;
