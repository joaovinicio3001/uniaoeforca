-- Fase 1 — campanhas e tabelas satélite (doc §7, §18, §21.2).

-- ------------------------------------------------------------------
-- campaigns
-- ------------------------------------------------------------------
create table if not exists public.campaigns (
  id                  uuid primary key default gen_random_uuid(),
  owner_user_id       uuid not null references auth.users (id) on delete restrict,
  title               text not null check (char_length(title) between 5 and 120),
  slug                citext not null unique,
  summary             text not null check (char_length(summary) between 10 and 200),
  story               text not null default '',
  category_id         uuid references public.categories (id) on delete set null,
  goal_amount_cents   bigint not null check (goal_amount_cents > 0),
  raised_amount_cents bigint not null default 0 check (raised_amount_cents >= 0),
  supporters_count    integer not null default 0 check (supporters_count >= 0),
  status              public.campaign_status not null default 'draft',
  visibility          public.campaign_visibility not null default 'public',
  city                text,
  state               char(2),
  cover_media_id      uuid,
  moderation_reason   text,
  created_at          timestamptz not null default now(),
  published_at        timestamptz,
  ended_at            timestamptz,
  updated_at          timestamptz not null default now(),
  search_tsv tsvector generated always as (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, ''))
  ) stored
);

comment on table public.campaigns is 'Campanhas de arrecadação (doc §7). raised_amount_cents/supporters_count são projeções mantidas pelo ledger a partir da Fase 3.';
comment on column public.campaigns.slug is 'Único e imutável após publicação. Alterações antes disso geram redirect (campaign_slug_redirects).';

create index if not exists idx_campaigns_status_visibility on public.campaigns (status, visibility);
create index if not exists idx_campaigns_owner on public.campaigns (owner_user_id);
create index if not exists idx_campaigns_category on public.campaigns (category_id);
create index if not exists idx_campaigns_published_at on public.campaigns (published_at desc nulls last);
create index if not exists idx_campaigns_search on public.campaigns using gin (search_tsv);

drop trigger if exists trg_campaigns_updated_at on public.campaigns;
create trigger trg_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- campaign_media  (metadados; binários vão para Bunny/Storage — doc §34.6)
-- ------------------------------------------------------------------
create table if not exists public.campaign_media (
  id               uuid primary key default gen_random_uuid(),
  campaign_id      uuid not null references public.campaigns (id) on delete cascade,
  kind             text not null default 'image' check (kind in ('image')),
  storage_provider text not null default 'supabase' check (storage_provider in ('supabase', 'bunny')),
  storage_key      text not null,
  public_url       text not null,
  position         int not null default 0,
  width            int,
  height           int,
  byte_size        int,
  created_at       timestamptz not null default now()
);

create index if not exists idx_campaign_media_campaign on public.campaign_media (campaign_id, position);

alter table public.campaigns
  drop constraint if exists campaigns_cover_media_fk;
alter table public.campaigns
  add constraint campaigns_cover_media_fk
  foreign key (cover_media_id) references public.campaign_media (id) on delete set null;

-- ------------------------------------------------------------------
-- campaign_updates (doc §7.1, §21.2)
-- ------------------------------------------------------------------
create table if not exists public.campaign_updates (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  title          text not null check (char_length(title) between 3 and 140),
  body           text not null default '',
  published_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists idx_campaign_updates_campaign
  on public.campaign_updates (campaign_id, published_at desc nulls last);

-- ------------------------------------------------------------------
-- campaign_slug_redirects (histórico de slug — doc §7.1)
-- ------------------------------------------------------------------
create table if not exists public.campaign_slug_redirects (
  old_slug    citext primary key,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- reports (denúncias — doc §7.3)
-- ------------------------------------------------------------------
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  campaign_id      uuid not null references public.campaigns (id) on delete cascade,
  reporter_user_id uuid references auth.users (id) on delete set null,
  reason           public.report_reason not null,
  details          text,
  status           public.report_status not null default 'open',
  resolution_note  text,
  resolved_by      uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz
);

create index if not exists idx_reports_campaign on public.reports (campaign_id);
create index if not exists idx_reports_status on public.reports (status) where status in ('open', 'reviewing');

-- ------------------------------------------------------------------
-- campaign_moderation_events (histórico de decisões — doc §7.3)
-- ------------------------------------------------------------------
create table if not exists public.campaign_moderation_events (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns (id) on delete cascade,
  actor_user_id  uuid references auth.users (id) on delete set null,
  from_status    public.campaign_status,
  to_status      public.campaign_status not null,
  reason         text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_moderation_events_campaign
  on public.campaign_moderation_events (campaign_id, created_at desc);

-- ------------------------------------------------------------------
-- Helpers (SECURITY DEFINER, schema private) para as policies de RLS
-- ------------------------------------------------------------------
create or replace function private.owns_campaign(uid uuid, cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.campaigns
    where id = cid and owner_user_id = uid
  );
$$;

create or replace function private.campaign_is_public(cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.campaigns
    where id = cid
      and status in ('active', 'completed')
      and visibility <> 'private'
  );
$$;
