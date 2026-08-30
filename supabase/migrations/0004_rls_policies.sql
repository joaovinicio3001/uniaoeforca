-- Fase 0 — Row Level Security.
-- Doc §34.7: "Ativar RLS em todas as tabelas expostas ao cliente";
-- "RLS não substitui validação server-side, autorização administrativa e auditoria".
--
-- Padrão adotado: deny-by-default. Só existe policy para o que o cliente pode
-- legitimamente fazer. Escrita sensível (papéis, auditoria, inserção de
-- notificações) fica fora da API do cliente e passa por service_role/funções.

alter table public.profiles       enable row level security;
alter table public.user_roles     enable row level security;
alter table public.audit_logs     enable row level security;
alter table public.notifications  enable row level security;

-- Blindagem extra: nega qualquer acesso direto do papel anon a estas tabelas.
-- (RLS já barra, mas revogar o grant deixa a intenção explícita.)
revoke all on public.profiles      from anon;
revoke all on public.user_roles    from anon;
revoke all on public.audit_logs    from anon;
revoke all on public.notifications from anon;

-- ------------------------- profiles -------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_select_staff on public.profiles;
create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
-- Sem INSERT (trigger handle_new_user) e sem DELETE (cascade de auth.users).

-- ------------------------- user_roles -------------------------
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_roles_select_staff on public.user_roles;
create policy user_roles_select_staff on public.user_roles
  for select to authenticated
  using (public.is_staff(auth.uid()));
-- Sem policies de INSERT/UPDATE/DELETE: alteração de papel só via service_role
-- (fluxo administrativo auditado — Fase 1+).

-- ------------------------- audit_logs -------------------------
drop policy if exists audit_logs_select_staff on public.audit_logs;
create policy audit_logs_select_staff on public.audit_logs
  for select to authenticated
  using (public.is_staff(auth.uid()));
-- Append-only: nenhuma policy de INSERT/UPDATE/DELETE. Escrita via service_role.

-- ------------------------- notifications -------------------------
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- INSERT sempre server-side; sem DELETE pelo cliente.
