-- Fase 4 — Saques + PIX Out (doc §11, §18, §34.4).

do $$ begin
  if not exists (select 1 from pg_type where typname = 'withdrawal_status') then
    create type public.withdrawal_status as enum (
      'requested', 'under_review', 'approved', 'processing',
      'paid', 'rejected', 'failed', 'canceled'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'pix_key_type') then
    create type public.pix_key_type as enum ('cpf', 'cnpj', 'email', 'phone', 'evp');
  end if;
  if not exists (select 1 from pg_type where typname = 'pix_key_status') then
    create type public.pix_key_status as enum ('pending', 'verified', 'disabled');
  end if;
end $$;

-- ------------------------------------------------------------------
-- pix_keys — chave de destino do saque (doc §11.4, §18).
-- O valor em claro é necessário para o PIX Out, então é CIFRADO (AES-GCM,
-- lib/security/crypto). value_hash permite dedup sem expor; value_masked p/ UI.
-- Cifra por Vault fica para a Fase 5.
-- ------------------------------------------------------------------
create table if not exists public.pix_keys (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  type            public.pix_key_type not null,
  value_encrypted text not null,
  value_hash      text not null,
  value_masked    text not null,
  owner_name      text,
  status          public.pix_key_status not null default 'pending',
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  disabled_at     timestamptz,
  unique (user_id, value_hash)
);
comment on table public.pix_keys is 'Chaves PIX do beneficiario (doc §11.4). value_encrypted = AES-GCM.';
create index if not exists idx_pix_keys_user on public.pix_keys (user_id, status);

-- ------------------------------------------------------------------
-- withdrawals (doc §11, §11.3, §34.4)
-- ------------------------------------------------------------------
create table if not exists public.withdrawals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete restrict,
  wallet_id        uuid not null references public.wallets (id) on delete restrict,
  campaign_id      uuid references public.campaigns (id) on delete set null,
  pix_key_id       uuid not null references public.pix_keys (id) on delete restrict,
  pix_key_snapshot jsonb not null default '{}'::jsonb,
  amount_cents     bigint not null check (amount_cents > 0),
  fee_cents        bigint not null default 0 check (fee_cents >= 0),
  net_cents        bigint not null check (net_cents > 0),
  status           public.withdrawal_status not null default 'requested',
  reviewed_by      uuid references auth.users (id) on delete set null,
  rejection_reason text,
  failure_reason   text,
  requested_at     timestamptz not null default now(),
  review_started_at timestamptz,
  approved_at      timestamptz,
  processing_at    timestamptz,
  paid_at          timestamptz,
  rejected_at      timestamptz,
  updated_at       timestamptz not null default now(),
  check (net_cents = amount_cents - fee_cents)
);
comment on table public.withdrawals is 'Solicitacoes de saque (doc §11). SLA de analise em ate 24h (§11.3).';
create index if not exists idx_withdrawals_user on public.withdrawals (user_id, requested_at desc);
create index if not exists idx_withdrawals_status on public.withdrawals (status);
create index if not exists idx_withdrawals_open
  on public.withdrawals (requested_at) where status in ('requested', 'under_review', 'approved', 'processing');

drop trigger if exists trg_withdrawals_updated_at on public.withdrawals;
create trigger trg_withdrawals_updated_at
  before update on public.withdrawals
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- provider_payouts (doc §18)
-- ------------------------------------------------------------------
create table if not exists public.provider_payouts (
  id                 uuid primary key default gen_random_uuid(),
  withdrawal_id      uuid not null unique references public.withdrawals (id) on delete cascade,
  provider           text not null default 'ggpix',
  provider_reference text,
  status             public.payment_status not null default 'created',
  external_fee_cents bigint,
  end_to_end_id      text,
  failure_reason     text,
  raw_last_response  jsonb,
  requested_at       timestamptz not null default now(),
  completed_at       timestamptz,
  unique (provider, provider_reference)
);
create index if not exists idx_provider_payouts_ref on public.provider_payouts (provider, provider_reference);

-- ------------------------------------------------------------------
-- withdrawal_events — trilha de mudança de status (doc §11.3, §14)
-- ------------------------------------------------------------------
create table if not exists public.withdrawal_events (
  id            uuid primary key default gen_random_uuid(),
  withdrawal_id uuid not null references public.withdrawals (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  from_status   public.withdrawal_status,
  to_status     public.withdrawal_status not null,
  reason        text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_withdrawal_events on public.withdrawal_events (withdrawal_id, created_at desc);
