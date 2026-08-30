-- Fase 2 — PIX In. Enums de pagamento + motor de taxas versionado (doc §8.1, §9).

do $$ begin
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('pix', 'card');
  end if;
  if not exists (select 1 from pg_type where typname = 'donation_status') then
    create type public.donation_status as enum (
      'created', 'pending', 'paid', 'failed', 'expired', 'refunded', 'chargeback'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'created', 'pending', 'paid', 'failed', 'expired', 'refunded', 'chargeback'
    );
  end if;
end $$;

-- ------------------------------------------------------------------
-- fee_rules — regras de taxa versionadas. NUNCA espalhar percentuais no código
-- (doc §9). Percentuais em basis points (500 = 5,00%) para evitar float.
-- ------------------------------------------------------------------
create table if not exists public.fee_rules (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  percentage_bps       int not null default 0 check (percentage_bps between 0 and 10000),
  fixed_fee_cents      bigint not null default 0 check (fixed_fee_cents >= 0),
  min_fee_cents        bigint not null default 0 check (min_fee_cents >= 0),
  withdrawal_fee_cents bigint not null default 0 check (withdrawal_fee_cents >= 0),
  active_from          timestamptz not null default now(),
  active_to            timestamptz,
  created_at           timestamptz not null default now(),
  check (active_to is null or active_to > active_from)
);

comment on table public.fee_rules is 'Regras de taxa versionadas (doc §9). Cada doação grava um snapshot da regra usada.';

create index if not exists idx_fee_rules_active
  on public.fee_rules (active_from desc);

insert into public.fee_rules (name, percentage_bps, fixed_fee_cents, min_fee_cents, withdrawal_fee_cents)
select 'padrao-v1', 500, 0, 0, 390
where not exists (select 1 from public.fee_rules);

-- Regra ativa "agora" (a mais recente cujo intervalo cobre o instante atual).
create or replace function public.current_fee_rule()
returns public.fee_rules
language sql stable set search_path = ''
as $$
  select *
  from public.fee_rules
  where active_from <= now()
    and (active_to is null or active_to > now())
  order by active_from desc
  limit 1
$$;
