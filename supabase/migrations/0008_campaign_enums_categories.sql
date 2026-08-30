-- Fase 1 — enums de campanha + categorias (doc §7.1, §7.2).

do $$ begin
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type public.campaign_status as enum (
      'draft', 'pending_review', 'active', 'paused',
      'completed', 'rejected', 'blocked', 'archived'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'campaign_visibility') then
    create type public.campaign_visibility as enum ('public', 'unlisted', 'private');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('open', 'reviewing', 'actioned', 'dismissed');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type public.report_reason as enum (
      'spam', 'fraude', 'conteudo_improprio', 'informacao_falsa',
      'direitos_autorais', 'outro'
    );
  end if;
end $$;

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,
  name        text not null,
  description text,
  icon        text,
  position    int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.categories is 'Categorias de campanha (doc §7.1).';

-- Seed idempotente (doc §7.1: saúde, emergência, animais, educação, família, projetos, esportes, outros)
insert into public.categories (slug, name, icon, position) values
  ('saude',      'Saúde',      'heart-pulse',    1),
  ('emergencia', 'Emergência', 'siren',          2),
  ('animais',    'Animais',    'paw-print',      3),
  ('educacao',   'Educação',   'graduation-cap', 4),
  ('familia',    'Família',    'users',          5),
  ('projetos',   'Projetos',   'lightbulb',      6),
  ('esportes',   'Esportes',   'trophy',         7),
  ('outros',     'Outros',     'ellipsis',       8)
on conflict (slug) do nothing;
