-- Dispositivos/sessões conhecidos do usuário para a aba "Segurança".
-- Capturado no LOGIN (server action, request direto do navegador) com o
-- User-Agent e IP reais — auth.sessions.user_agent/ip refletem o runtime SSR
-- (Vercel Edge / Next Middleware), não o dispositivo do usuário.
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  auth_session_id uuid not null,
  user_agent text,
  ip text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, auth_session_id)
);

create index if not exists user_devices_user_idx
  on public.user_devices (user_id, last_seen_at desc);

alter table public.user_devices enable row level security;

-- O dono lê os próprios dispositivos. Escrita é exclusiva do service role
-- (server actions), então não há policy de insert/update/delete.
create policy user_devices_select_own on public.user_devices
  for select using ((select auth.uid()) = user_id);

comment on table public.user_devices is
  'Dispositivos onde a conta foi acessada (User-Agent/IP reais capturados no login). Vinculado a auth.sessions.id.';
