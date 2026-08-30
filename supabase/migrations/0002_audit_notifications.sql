-- Fase 0 — auditoria e notificações.
-- Doc §13.2 (módulo Auditoria: quem/o quê/quando/de onde/antes-depois),
-- §22 (notificações), §28 ("aprovação administrativa fica auditada").

-- ------------------------------------------------------------------
-- audit_logs: imutável. Sem UPDATE/DELETE por ninguém via API (sem policy).
-- Escrita via service_role (lib/security/audit.ts).
-- ------------------------------------------------------------------
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action        text not null,
  entity_type   text not null,
  entity_id     text,
  before_json   jsonb,
  after_json    jsonb,
  ip            inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

comment on table public.audit_logs is 'Trilha de auditoria imutável (doc §13.2). Append-only.';

create index if not exists idx_audit_entity on public.audit_logs (entity_type, entity_id);
create index if not exists idx_audit_actor on public.audit_logs (actor_user_id);
create index if not exists idx_audit_created_at on public.audit_logs (created_at desc);

-- ------------------------------------------------------------------
-- notifications: eventos para o usuário (doc §22). Marca de leitura via UPDATE
-- restrito ao dono. Inserção sempre server-side.
-- ------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'Notificações do usuário (doc §22).';

create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_unread
  on public.notifications (user_id) where read_at is null;
