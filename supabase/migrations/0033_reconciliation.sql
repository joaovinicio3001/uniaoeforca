-- Fase 6 — Conciliação financeira (doc §12, §13.1, §18, §29).

do $$ begin
  if not exists (select 1 from pg_type where typname = 'recon_kind') then
    create type public.recon_kind as enum ('pix_in', 'pix_out', 'ledger_internal');
  end if;
  if not exists (select 1 from pg_type where typname = 'recon_item_status') then
    create type public.recon_item_status as enum (
      'matched', 'divergent', 'missing_internal', 'missing_external', 'resolved'
    );
  end if;
end $$;

create table if not exists public.reconciliation_runs (
  id            uuid primary key default gen_random_uuid(),
  kind          public.recon_kind not null,
  provider      text,
  period_start  timestamptz,
  period_end    timestamptz,
  items_checked int not null default 0,
  divergences   int not null default 0,
  status        text not null default 'running' check (status in ('running', 'done', 'error')),
  error         text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index if not exists idx_recon_runs_kind on public.reconciliation_runs (kind, started_at desc);

create table if not exists public.reconciliation_items (
  id                   uuid primary key default gen_random_uuid(),
  run_id               uuid references public.reconciliation_runs (id) on delete set null,
  kind                 public.recon_kind not null,
  provider             text,
  external_reference   text,
  internal_reference   text,
  amount_expected_cents bigint,
  amount_actual_cents  bigint,
  status               public.recon_item_status not null default 'divergent',
  details              jsonb not null default '{}'::jsonb,
  resolution_note      text,
  resolved_by          uuid references auth.users (id) on delete set null,
  resolved_at          timestamptz,
  created_at           timestamptz not null default now()
);
create index if not exists idx_recon_items_open on public.reconciliation_items (created_at desc)
  where status <> 'resolved' and status <> 'matched';
create index if not exists idx_recon_items_ext on public.reconciliation_items (provider, external_reference);

-- ------------------------------------------------------------------
-- settle_provider_fee_in — acerta o custo do provedor de PIX In (doc §9, §12).
-- Estimativa foi lançada em PROVIDER_FEES (crédito) no confirm_donation_payment.
-- Aqui liquidamos o valor REAL: D PROVIDER_FEES real / C CASH_PROVIDER_IN real.
-- Diferença estimativa×real fica registrada como reconciliation_item.
-- ------------------------------------------------------------------
create or replace function public.settle_provider_fee_in(
  p_payment_id uuid, p_real_fee_cents bigint, p_run_id uuid default null
)
returns text language plpgsql security definer set search_path = '' as $$
declare v_p public.payments%rowtype; v_est bigint;
begin
  select * into v_p from public.payments where id = p_payment_id for update;
  if not found then return 'not_found'; end if;
  if v_p.status <> 'paid' then return 'not_paid'; end if;
  if exists (select 1 from public.ledger_transactions
             where idempotency_key = 'provfee_settle:' || v_p.id) then
    return 'already_settled';
  end if;

  v_est := coalesce(v_p.provider_fee_cents, 0);

  if p_real_fee_cents > 0 then
    perform private.post_ledger_transaction(
      'provfee_settle:' || v_p.id, 'payment', v_p.id, null,
      'Liquidação do custo do provedor de entrada',
      jsonb_build_array(
        jsonb_build_object('account_id', private.account_id(null, 'PROVIDER_FEES'),
                           'direction', 'debit',  'amount_cents', p_real_fee_cents),
        jsonb_build_object('account_id', private.account_id(null, 'CASH_PROVIDER_IN'),
                           'direction', 'credit', 'amount_cents', p_real_fee_cents)
      ));
  end if;

  update public.payments set provider_fee_cents = p_real_fee_cents where id = v_p.id;

  insert into public.reconciliation_items
    (run_id, kind, provider, external_reference, internal_reference,
     amount_expected_cents, amount_actual_cents, status, details)
  values
    (p_run_id, 'pix_in', v_p.provider, v_p.provider_reference, v_p.id::text,
     v_est, p_real_fee_cents,
     case when v_est = p_real_fee_cents then 'matched' else 'divergent' end,
     jsonb_build_object('estimated_fee_cents', v_est, 'real_fee_cents', p_real_fee_cents,
                        'delta_cents', p_real_fee_cents - v_est));
  return 'settled';
end;
$$;
revoke all on function public.settle_provider_fee_in(uuid, bigint, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- reconcile_ledger_internal — autoconferência do ledger (doc §12).
-- ------------------------------------------------------------------
create or replace function public.reconcile_ledger_internal(p_run_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_gross_donations bigint;
  v_cash_in bigint;
  v_net_withdrawn bigint;
  v_cash_out bigint;
  v_global bigint;
  v_div int := 0;
begin
  select coalesce(sum(gross_amount_cents), 0) into v_gross_donations
  from public.donations where status = 'paid';
  select coalesce(sum(case direction when 'debit' then amount_cents else -amount_cents end), 0)
  into v_cash_in
  from public.ledger_entries e join public.ledger_accounts a on a.id = e.account_id
  where a.code = 'CASH_PROVIDER_IN';

  select coalesce(sum(net_cents), 0) into v_net_withdrawn
  from public.withdrawals where status = 'paid';
  select coalesce(sum(case direction when 'credit' then amount_cents else -amount_cents end), 0)
  into v_cash_out
  from public.ledger_entries e join public.ledger_accounts a on a.id = e.account_id
  where a.code = 'CASH_PIXOUT';

  select coalesce(sum(signed_cents), 0) into v_global from public.v_ledger_trial_balance;

  -- CASH_PROVIDER_IN (livro) deve refletir (bruto recebido − custo do provedor já liquidado).
  -- Enquanto não liquidado, PROVIDER_FEES segura a diferença. Divergência real =
  -- global <> 0 ou CASH_PIXOUT pago <> soma dos net.
  if v_global <> 0 then
    insert into public.reconciliation_items (run_id, kind, status, details)
    values (p_run_id, 'ledger_internal', 'divergent',
            jsonb_build_object('check', 'global_trial_balance', 'value_cents', v_global));
    v_div := v_div + 1;
  end if;
  if v_cash_out <> v_net_withdrawn then
    insert into public.reconciliation_items
      (run_id, kind, status, amount_expected_cents, amount_actual_cents, details)
    values (p_run_id, 'ledger_internal', 'divergent', v_net_withdrawn, v_cash_out,
            jsonb_build_object('check', 'cash_pixout_vs_net_withdrawals'));
    v_div := v_div + 1;
  end if;

  return jsonb_build_object(
    'ok', true, 'divergences', v_div,
    'gross_donations', v_gross_donations, 'cash_provider_in', v_cash_in,
    'net_withdrawn', v_net_withdrawn, 'cash_pixout', v_cash_out,
    'global_trial_balance', v_global);
end;
$$;
revoke all on function public.reconcile_ledger_internal(uuid) from public, anon, authenticated;
