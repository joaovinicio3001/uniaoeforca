-- Fase 3 — Ledger imutável de dupla entrada (doc §10, §18, §28).
--
-- Invariante central: para cada ledger_transaction, SUM(débitos) = SUM(créditos).
-- Lançamentos confirmados NUNCA são apagados/editados — correções são feitas
-- com lançamentos compensatórios (doc §10). Nenhuma policy de UPDATE/DELETE.

-- ------------------------------------------------------------------
-- wallets — uma por usuário beneficiário (dono de campanha).
-- ------------------------------------------------------------------
create table if not exists public.wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete restrict,
  currency   char(3) not null default 'BRL',
  status     text not null default 'active' check (status in ('active', 'frozen')),
  created_at timestamptz not null default now()
);
comment on table public.wallets is 'Carteira do beneficiário (doc §18).';

-- ------------------------------------------------------------------
-- ledger_accounts — contas contábeis (doc §10.1).
-- wallet_id NULL = conta global da plataforma (uma por code).
-- wallet_id set  = conta por carteira (CAMPAIGN_PENDING/AVAILABLE/RESERVED).
-- ------------------------------------------------------------------
create table if not exists public.ledger_accounts (
  id             uuid primary key default gen_random_uuid(),
  wallet_id      uuid references public.wallets (id) on delete restrict,
  code           text not null,
  kind           text not null check (kind in ('asset', 'liability', 'revenue', 'expense', 'equity')),
  normal_balance text not null check (normal_balance in ('debit', 'credit')),
  created_at     timestamptz not null default now(),
  unique nulls not distinct (wallet_id, code)
);
comment on table public.ledger_accounts is 'Plano de contas (doc §10.1). PROVIDER_FEES é conta de acúmulo (crédito) contra CASH_PROVIDER_IN, reconciliada na Fase 6.';
create index if not exists idx_ledger_accounts_wallet on public.ledger_accounts (wallet_id);

-- Contas globais fixas.
insert into public.ledger_accounts (wallet_id, code, kind, normal_balance) values
  (null, 'CASH_PROVIDER_IN',   'asset',     'debit'),
  (null, 'CASH_PIXOUT',        'asset',     'debit'),
  (null, 'PLATFORM_REVENUE',   'revenue',   'credit'),
  (null, 'PROVIDER_FEES',      'liability', 'credit'),
  (null, 'REFUND_RESERVE',     'liability', 'credit'),
  (null, 'WITHDRAWAL_PAYABLE', 'liability', 'credit')
on conflict do nothing;

-- ------------------------------------------------------------------
-- ledger_transactions / ledger_entries
-- ------------------------------------------------------------------
create table if not exists public.ledger_transactions (
  id              uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  reference_type  text not null,
  reference_id    uuid,
  campaign_id     uuid references public.campaigns (id) on delete set null,
  description     text not null default '',
  posted_at       timestamptz not null default now()
);
comment on table public.ledger_transactions is 'Lançamento (doc §18). idempotency_key impede dupla contabilização (§8.4, §28).';
create index if not exists idx_ledger_tx_reference on public.ledger_transactions (reference_type, reference_id);
create index if not exists idx_ledger_tx_campaign on public.ledger_transactions (campaign_id);

create table if not exists public.ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions (id) on delete restrict,
  account_id     uuid not null references public.ledger_accounts (id) on delete restrict,
  direction      text not null check (direction in ('debit', 'credit')),
  amount_cents   bigint not null check (amount_cents > 0),
  created_at     timestamptz not null default now()
);
create index if not exists idx_ledger_entries_tx on public.ledger_entries (transaction_id);
create index if not exists idx_ledger_entries_account on public.ledger_entries (account_id);

-- ------------------------------------------------------------------
-- wallet_balances — projeção mantida transacionalmente (doc §10, §10.2).
-- ------------------------------------------------------------------
create table if not exists public.wallet_balances (
  wallet_id      uuid primary key references public.wallets (id) on delete cascade,
  pending_cents  bigint not null default 0,
  available_cents bigint not null default 0,
  reserved_cents bigint not null default 0,
  withdrawn_cents bigint not null default 0,
  updated_at     timestamptz not null default now(),
  check (available_cents >= 0),
  check (reserved_cents >= 0)
);

-- ------------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------------
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
    (v_id, 'CAMPAIGN_RESERVED',  'liability', 'credit')
  on conflict do nothing;

  return v_id;
end;
$$;

create or replace function private.account_id(p_wallet_id uuid, p_code text)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.ledger_accounts
  where code = p_code and wallet_id is not distinct from p_wallet_id;
$$;

create or replace function private.recompute_wallet_balance(p_wallet_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.wallet_balances wb set
    pending_cents = coalesce((
      select sum(case e.direction when 'credit' then e.amount_cents else -e.amount_cents end)
      from public.ledger_entries e
      join public.ledger_accounts a on a.id = e.account_id
      where a.wallet_id = p_wallet_id and a.code = 'CAMPAIGN_PENDING'), 0),
    available_cents = coalesce((
      select sum(case e.direction when 'credit' then e.amount_cents else -e.amount_cents end)
      from public.ledger_entries e
      join public.ledger_accounts a on a.id = e.account_id
      where a.wallet_id = p_wallet_id and a.code = 'CAMPAIGN_AVAILABLE'), 0),
    reserved_cents = coalesce((
      select sum(case e.direction when 'credit' then e.amount_cents else -e.amount_cents end)
      from public.ledger_entries e
      join public.ledger_accounts a on a.id = e.account_id
      where a.wallet_id = p_wallet_id and a.code = 'CAMPAIGN_RESERVED'), 0),
    updated_at = now()
  where wb.wallet_id = p_wallet_id;
end;
$$;

-- ------------------------------------------------------------------
-- post_ledger_transaction — único caminho de escrita no ledger.
-- p_entries: jsonb [{ "account_id": uuid, "direction": "debit"|"credit", "amount_cents": int }]
-- ------------------------------------------------------------------
create or replace function private.post_ledger_transaction(
  p_idempotency_key text,
  p_reference_type  text,
  p_reference_id    uuid,
  p_campaign_id     uuid,
  p_description     text,
  p_entries         jsonb
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_tx_id   uuid;
  v_debits  bigint := 0;
  v_credits bigint := 0;
  v_count   int := 0;
  e         jsonb;
  v_wallet  uuid;
begin
  select id into v_tx_id from public.ledger_transactions where idempotency_key = p_idempotency_key;
  if found then
    return v_tx_id; -- idempotente
  end if;

  for e in select * from jsonb_array_elements(p_entries) loop
    v_count := v_count + 1;
    if (e->>'direction') = 'debit' then
      v_debits := v_debits + (e->>'amount_cents')::bigint;
    elsif (e->>'direction') = 'credit' then
      v_credits := v_credits + (e->>'amount_cents')::bigint;
    else
      raise exception 'direction inválida: %', e->>'direction';
    end if;
    if (e->>'amount_cents')::bigint <= 0 then
      raise exception 'amount_cents deve ser > 0';
    end if;
  end loop;

  if v_count < 2 then
    raise exception 'lançamento precisa de ao menos 2 partidas';
  end if;
  if v_debits <> v_credits then
    raise exception 'lançamento não fecha: débitos % <> créditos %', v_debits, v_credits;
  end if;

  insert into public.ledger_transactions
    (idempotency_key, reference_type, reference_id, campaign_id, description)
  values (p_idempotency_key, p_reference_type, p_reference_id, p_campaign_id, coalesce(p_description, ''))
  returning id into v_tx_id;

  insert into public.ledger_entries (transaction_id, account_id, direction, amount_cents)
  select v_tx_id, (e->>'account_id')::uuid, e->>'direction', (e->>'amount_cents')::bigint
  from jsonb_array_elements(p_entries) e;

  -- Recalcula saldos das carteiras tocadas.
  for v_wallet in
    select distinct a.wallet_id
    from public.ledger_entries en
    join public.ledger_accounts a on a.id = en.account_id
    where en.transaction_id = v_tx_id and a.wallet_id is not null
  loop
    perform private.recompute_wallet_balance(v_wallet);
  end loop;

  return v_tx_id;
end;
$$;

-- ------------------------------------------------------------------
-- Views de conferência (doc §27 "cada centavo reconciliável")
-- ------------------------------------------------------------------
-- security_invoker: as views respeitam a RLS de quem consulta (PG15+).
create or replace view public.v_ledger_trial_balance
with (security_invoker = true) as
  select a.code,
         a.wallet_id,
         sum(case e.direction when 'debit' then e.amount_cents else -e.amount_cents end) as signed_cents
  from public.ledger_entries e
  join public.ledger_accounts a on a.id = e.account_id
  group by a.code, a.wallet_id;

comment on view public.v_ledger_trial_balance is
  'Balancete. A soma de signed_cents sobre TODAS as linhas deve ser 0 (dupla entrada).';

create or replace view public.v_ledger_imbalanced
with (security_invoker = true) as
  select t.id as transaction_id, t.idempotency_key,
         sum(case e.direction when 'debit' then e.amount_cents else -e.amount_cents end) as delta_cents
  from public.ledger_transactions t
  join public.ledger_entries e on e.transaction_id = t.id
  group by t.id, t.idempotency_key
  having sum(case e.direction when 'debit' then e.amount_cents else -e.amount_cents end) <> 0;

comment on view public.v_ledger_imbalanced is 'Deve estar sempre VAZIA.';
