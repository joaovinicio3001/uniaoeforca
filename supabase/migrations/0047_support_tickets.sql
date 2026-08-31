-- Central de suporte: chamados abertos pelo usuário + thread de mensagens.
do $$ begin
  create type public.support_ticket_status as enum
    ('open', 'waiting_user', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.support_ticket_category as enum
    ('duvida', 'pagamento', 'saque', 'verificacao', 'campanha', 'denuncia', 'outro');
exception when duplicate_object then null; end $$;

create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  subject         text not null,
  category        public.support_ticket_category not null default 'outro',
  status          public.support_ticket_status not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null references public.support_tickets (id) on delete cascade,
  author_user_id uuid not null references auth.users (id),
  is_staff       boolean not null default false,
  body           text not null,
  created_at     timestamptz not null default now()
);

create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id, last_message_at desc);
create index if not exists support_tickets_status_idx
  on public.support_tickets (status, last_message_at desc);
create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

grant select, insert on public.support_tickets to authenticated;
grant select, insert on public.support_ticket_messages to authenticated;

-- Usuário vê e cria os próprios chamados. Ações de staff usam service_role.
drop policy if exists support_tickets_own on public.support_tickets;
create policy support_tickets_own on public.support_tickets
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists support_tickets_insert_own on public.support_tickets;
create policy support_tickets_insert_own on public.support_tickets
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists support_messages_own on public.support_ticket_messages;
create policy support_messages_own on public.support_ticket_messages
  for select to authenticated using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = (select auth.uid())
    )
  );

drop policy if exists support_messages_insert_own on public.support_ticket_messages;
create policy support_messages_insert_own on public.support_ticket_messages
  for insert to authenticated with check (
    author_user_id = (select auth.uid())
    and is_staff = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = (select auth.uid())
    )
  );

comment on table public.support_tickets is 'Chamados de suporte abertos pelos usuários.';
