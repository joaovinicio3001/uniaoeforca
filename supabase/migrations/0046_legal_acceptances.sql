-- Registro versionado do aceite de documentos legais (doc §33 / LGPD).
-- Uma linha por (usuário, documento, versão): quem aceitou o quê e quando.
create table if not exists public.legal_acceptances (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  document    text not null check (document in ('terms', 'privacy', 'campaign_policy')),
  version     text not null,
  accepted_at timestamptz not null default now(),
  ip          inet,
  user_agent  text,
  unique (user_id, document, version)
);

create index if not exists legal_acceptances_user_idx
  on public.legal_acceptances (user_id, document);

alter table public.legal_acceptances enable row level security;

-- O usuário lê os próprios aceites; escrita é feita pelo servidor (service_role).
drop policy if exists legal_acceptances_select_own on public.legal_acceptances;
create policy legal_acceptances_select_own on public.legal_acceptances
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.legal_acceptances to authenticated;

comment on table public.legal_acceptances is
  'Aceite versionado de Termos, Privacidade e Política de Campanhas por usuário.';
