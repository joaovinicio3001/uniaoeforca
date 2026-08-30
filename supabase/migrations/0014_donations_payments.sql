-- Fase 2 — doações, pagamentos e eventos de webhook (doc §8.1, §8.4, §18, §20).

-- ------------------------------------------------------------------
-- donations
-- ------------------------------------------------------------------
create table if not exists public.donations (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null references public.campaigns (id) on delete restrict,
  donor_user_id      uuid references auth.users (id) on delete set null,
  donor_name         text,
  anonymous          boolean not null default false,
  message            text,
  gross_amount_cents bigint not null check (gross_amount_cents >= 500),
  platform_fee_cents bigint not null default 0 check (platform_fee_cents >= 0),
  provider_fee_cents bigint not null default 0 check (provider_fee_cents >= 0),
  net_amount_cents   bigint not null check (net_amount_cents > 0),
  payment_method     public.payment_method not null default 'pix',
  status             public.donation_status not null default 'created',
  fee_rule_id        uuid references public.fee_rules (id),
  fee_rule_snapshot  jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

comment on table public.donations is 'Intenções de doação (doc §8.1). fee_rule_snapshot = regra vigente no momento (doc §9).';

create index if not exists idx_donations_campaign on public.donations (campaign_id, created_at desc);
create index if not exists idx_donations_donor on public.donations (donor_user_id);
create index if not exists idx_donations_status on public.donations (status);
create index if not exists idx_donations_campaign_paid
  on public.donations (campaign_id) where status = 'paid';

-- ------------------------------------------------------------------
-- payments — 1:1 com donation. provider_reference = id da cobrança no provedor.
-- ------------------------------------------------------------------
create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  donation_id        uuid not null unique references public.donations (id) on delete cascade,
  provider           text not null default 'pushinpay',
  provider_reference text,
  status             public.payment_status not null default 'created',
  amount_cents       bigint not null check (amount_cents >= 500),
  provider_fee_cents bigint not null default 0,
  qr_code            text,
  qr_code_base64     text,
  end_to_end_id      text,
  payer_name         text,
  payer_document     text,
  expires_at         timestamptz,
  raw_last_response  jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  paid_at            timestamptz,
  unique (provider, provider_reference)
);

comment on table public.payments is 'Cobrança no provedor (doc §8.1). Confirmação só por retorno validado do provedor (doc §8.3).';

create index if not exists idx_payments_provider_ref on public.payments (provider, provider_reference);
create index if not exists idx_payments_status on public.payments (status) where status in ('created', 'pending');

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- webhook_events — idempotência (doc §8.4, §20). event_id único por provedor.
-- ------------------------------------------------------------------
create table if not exists public.webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null,
  event_id     text not null,
  payload_hash text not null,
  payload      jsonb not null,
  status       text not null default 'received'
                 check (status in ('received', 'processing', 'processed', 'ignored', 'error')),
  error        text,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);

comment on table public.webhook_events is 'Eventos de webhook para processamento idempotente (doc §8.4, §20).';

create index if not exists idx_webhook_events_status on public.webhook_events (status) where status <> 'processed';
