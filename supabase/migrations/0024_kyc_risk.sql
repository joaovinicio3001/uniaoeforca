-- Fase 5 — KYC, fraude e risco (doc §14). "Controles proporcionais ao risco."

do $$ begin
  if not exists (select 1 from pg_type where typname = 'kyc_status') then
    create type public.kyc_status as enum (
      'not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'kyc_level') then
    create type public.kyc_level as enum ('basic', 'enhanced');
  end if;
  if not exists (select 1 from pg_type where typname = 'kyc_doc_kind') then
    create type public.kyc_doc_kind as enum ('id_front', 'id_back', 'selfie', 'proof_of_address');
  end if;
  if not exists (select 1 from pg_type where typname = 'risk_level') then
    create type public.risk_level as enum ('low', 'medium', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'risk_flag_type') then
    create type public.risk_flag_type as enum (
      'velocity_withdrawals', 'velocity_donations', 'unusual_amount',
      'fast_create_withdraw', 'multi_account_ip', 'multi_account_cpf',
      'multi_account_pix', 'blocklist_hit', 'manual'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'risk_severity') then
    create type public.risk_severity as enum ('info', 'warning', 'critical');
  end if;
  if not exists (select 1 from pg_type where typname = 'risk_flag_status') then
    create type public.risk_flag_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
  end if;
  if not exists (select 1 from pg_type where typname = 'blocklist_entity') then
    create type public.blocklist_entity as enum ('user', 'campaign', 'cpf_hash', 'pix_key_hash', 'ip_hash');
  end if;
  if not exists (select 1 from pg_type where typname = 'hold_status') then
    create type public.hold_status as enum ('active', 'released');
  end if;
end $$;

-- ------------------------------------------------------------------
-- kyc_cases (doc §14, §18)
-- ------------------------------------------------------------------
create table if not exists public.kyc_cases (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  level               public.kyc_level not null default 'basic',
  status              public.kyc_status not null default 'pending',
  provider            text,
  provider_reference  text,
  risk_score          int not null default 0 check (risk_score between 0 and 100),
  risk_level          public.risk_level not null default 'low',
  full_name_submitted text,
  birth_date_submitted date,
  cpf_hash_submitted  text,
  rejection_reason    text,
  reviewed_by         uuid references auth.users (id) on delete set null,
  submitted_at        timestamptz not null default now(),
  reviewed_at         timestamptz,
  approved_at         timestamptz,
  expires_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_kyc_cases_user on public.kyc_cases (user_id, status);
create index if not exists idx_kyc_cases_open on public.kyc_cases (submitted_at)
  where status in ('pending', 'in_review');

drop trigger if exists trg_kyc_cases_updated_at on public.kyc_cases;
create trigger trg_kyc_cases_updated_at
  before update on public.kyc_cases
  for each row execute function public.set_updated_at();

-- Documentos de KYC: privados (doc §34.6). Só metadados/keys aqui.
create table if not exists public.kyc_documents (
  id               uuid primary key default gen_random_uuid(),
  kyc_case_id      uuid not null references public.kyc_cases (id) on delete cascade,
  kind             public.kyc_doc_kind not null,
  storage_provider text not null default 'supabase',
  storage_key      text not null,
  byte_size        int,
  created_at       timestamptz not null default now()
);
create index if not exists idx_kyc_documents_case on public.kyc_documents (kyc_case_id);

-- ------------------------------------------------------------------
-- risk_flags (doc §14)
-- ------------------------------------------------------------------
create table if not exists public.risk_flags (
  id            uuid primary key default gen_random_uuid(),
  type          public.risk_flag_type not null,
  severity      public.risk_severity not null default 'warning',
  status        public.risk_flag_status not null default 'open',
  user_id       uuid references auth.users (id) on delete set null,
  campaign_id   uuid references public.campaigns (id) on delete set null,
  withdrawal_id uuid references public.withdrawals (id) on delete set null,
  details       jsonb not null default '{}'::jsonb,
  resolved_by   uuid references auth.users (id) on delete set null,
  resolution_note text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);
create index if not exists idx_risk_flags_open on public.risk_flags (created_at desc)
  where status in ('open', 'reviewing');
create index if not exists idx_risk_flags_user on public.risk_flags (user_id);
create index if not exists idx_risk_flags_withdrawal on public.risk_flags (withdrawal_id);

-- ------------------------------------------------------------------
-- account_ip_signals — para detecção de múltiplas contas por IP (doc §14)
-- ------------------------------------------------------------------
create table if not exists public.account_ip_signals (
  user_id       uuid not null references auth.users (id) on delete cascade,
  ip_hash       text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  hits          int not null default 1,
  primary key (user_id, ip_hash)
);
create index if not exists idx_ip_signals_ip on public.account_ip_signals (ip_hash);

-- ------------------------------------------------------------------
-- blocklist (doc §14 "Lista de campanhas/usuários bloqueados e motivos")
-- ------------------------------------------------------------------
create table if not exists public.blocklist (
  id           uuid primary key default gen_random_uuid(),
  entity_type  public.blocklist_entity not null,
  entity_value text not null,
  reason       text not null,
  active       boolean not null default true,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  lifted_by    uuid references auth.users (id) on delete set null,
  lifted_at    timestamptz
);
create unique index if not exists uq_blocklist_active
  on public.blocklist (entity_type, entity_value) where active;

-- ------------------------------------------------------------------
-- wallet_holds — indisponibilidade temporária de saldo (doc §14)
-- ------------------------------------------------------------------
create table if not exists public.wallet_holds (
  id           uuid primary key default gen_random_uuid(),
  wallet_id    uuid not null references public.wallets (id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  reason       text not null,
  status       public.hold_status not null default 'active',
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  released_by  uuid references auth.users (id) on delete set null,
  released_at  timestamptz
);
create index if not exists idx_wallet_holds_active on public.wallet_holds (wallet_id)
  where status = 'active';

-- ------------------------------------------------------------------
-- Ledger: conta CAMPAIGN_HELD por carteira + coluna held_cents
-- ------------------------------------------------------------------
alter table public.wallet_balances
  add column if not exists held_cents bigint not null default 0;

-- ensure_wallet passa a criar também CAMPAIGN_HELD.
create or replace function private.ensure_wallet(p_user_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.wallets (user_id) values (p_user_id)
  on conflict (user_id) do nothing;
  select id into v_id from public.wallets where user_id = p_user_id;

  insert into public.wallet_balances (wallet_id) values (v_id)
  on conflict (wallet_id) do nothing;

  insert into public.ledger_accounts (wallet_id, code, kind, normal_balance) values
    (v_id, 'CAMPAIGN_PENDING',   'liability', 'credit'),
    (v_id, 'CAMPAIGN_AVAILABLE', 'liability', 'credit'),
    (v_id, 'CAMPAIGN_RESERVED',  'liability', 'credit'),
    (v_id, 'CAMPAIGN_HELD',      'liability', 'credit')
  on conflict do nothing;

  return v_id;
end;
$$;

-- Cria CAMPAIGN_HELD para carteiras já existentes.
insert into public.ledger_accounts (wallet_id, code, kind, normal_balance)
select id, 'CAMPAIGN_HELD', 'liability', 'credit' from public.wallets
on conflict do nothing;

-- recompute_wallet_balance passa a calcular held_cents.
create or replace function private.recompute_wallet_balance(p_wallet_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.wallet_balances wb set
    pending_cents = coalesce((
      select sum(case e.direction when 'credit' then e.amount_cents else -e.amount_cents end)
      from public.ledger_entries e join public.ledger_accounts a on a.id = e.account_id
      where a.wallet_id = p_wallet_id and a.code = 'CAMPAIGN_PENDING'), 0),
    available_cents = coalesce((
      select sum(case e.direction when 'credit' then e.amount_cents else -e.amount_cents end)
      from public.ledger_entries e join public.ledger_accounts a on a.id = e.account_id
      where a.wallet_id = p_wallet_id and a.code = 'CAMPAIGN_AVAILABLE'), 0),
    reserved_cents = coalesce((
      select sum(case e.direction when 'credit' then e.amount_cents else -e.amount_cents end)
      from public.ledger_entries e join public.ledger_accounts a on a.id = e.account_id
      where a.wallet_id = p_wallet_id and a.code = 'CAMPAIGN_RESERVED'), 0),
    held_cents = coalesce((
      select sum(case e.direction when 'credit' then e.amount_cents else -e.amount_cents end)
      from public.ledger_entries e join public.ledger_accounts a on a.id = e.account_id
      where a.wallet_id = p_wallet_id and a.code = 'CAMPAIGN_HELD'), 0),
    updated_at = now()
  where wb.wallet_id = p_wallet_id;
end;
$$;

-- ------------------------------------------------------------------
-- withdrawals: dupla aprovação de alto valor (doc §14)
-- ------------------------------------------------------------------
alter table public.withdrawals
  add column if not exists first_approved_by uuid references auth.users (id) on delete set null,
  add column if not exists first_approved_at timestamptz;

-- ------------------------------------------------------------------
-- Bucket privado para documentos de KYC (doc §34.6)
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-docs', 'kyc-docs', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false;
-- Sem policies em storage.objects para este bucket → só service_role acessa
-- (staff recebe URL assinada gerada server-side).
