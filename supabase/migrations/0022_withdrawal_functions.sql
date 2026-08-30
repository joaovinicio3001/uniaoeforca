-- Fase 4 — funções transacionais de saque (doc §11, §28, §34.4).
-- Money-safety: reserva atômica (AVAILABLE→RESERVED) sob lock; falha de PIX Out
-- devolve o valor por lançamento compensatório — nada "some" (§28).

-- ------------------------------------------------------------------
-- request_withdrawal — cria a solicitação e reserva o saldo em UMA transação.
-- ------------------------------------------------------------------
create or replace function public.request_withdrawal(
  p_user_id       uuid,
  p_pix_key_id    uuid,
  p_amount_cents  bigint,
  p_campaign_id   uuid default null,
  p_cooldown_hours int default 24,
  p_daily_max_cents bigint default 200000000,
  p_min_cents     bigint default 2000,
  p_max_cents     bigint default 500000000
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet   uuid;
  v_bal      public.wallet_balances%rowtype;
  v_key      public.pix_keys%rowtype;
  v_fee      bigint;
  v_net      bigint;
  v_id       uuid;
  v_today_sum bigint;
begin
  if p_amount_cents < p_min_cents then
    return jsonb_build_object('ok', false, 'error', 'Valor abaixo do mínimo permitido.');
  end if;
  if p_amount_cents > p_max_cents then
    return jsonb_build_object('ok', false, 'error', 'Valor acima do máximo permitido.');
  end if;

  v_wallet := private.ensure_wallet(p_user_id);

  select * into v_bal from public.wallet_balances where wallet_id = v_wallet for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Carteira sem saldo.');
  end if;

  select * into v_key from public.pix_keys
   where id = p_pix_key_id and user_id = p_user_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Chave PIX não encontrada.');
  end if;
  if v_key.status <> 'verified' then
    return jsonb_build_object('ok', false, 'error', 'Chave PIX ainda não verificada.');
  end if;
  if v_key.created_at > now() - make_interval(hours => p_cooldown_hours) then
    return jsonb_build_object('ok', false, 'error',
      'Chave PIX em período de segurança (cooldown). Tente mais tarde.');
  end if;

  if (select status from public.wallets where id = v_wallet) <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'Carteira bloqueada. Contate o suporte.');
  end if;

  v_fee := coalesce((public.current_fee_rule()).withdrawal_fee_cents, 0);
  v_net := p_amount_cents - v_fee;
  if v_net <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Valor não cobre a taxa de saque.');
  end if;

  if v_bal.available_cents < p_amount_cents then
    return jsonb_build_object('ok', false, 'error', 'Saldo disponível insuficiente.');
  end if;

  select coalesce(sum(amount_cents), 0) into v_today_sum
  from public.withdrawals
  where user_id = p_user_id
    and status not in ('rejected', 'failed', 'canceled')
    and requested_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo')
                        at time zone 'America/Sao_Paulo';
  if v_today_sum + p_amount_cents > p_daily_max_cents then
    return jsonb_build_object('ok', false, 'error', 'Limite diário de saque excedido.');
  end if;

  insert into public.withdrawals
    (user_id, wallet_id, campaign_id, pix_key_id, pix_key_snapshot,
     amount_cents, fee_cents, net_cents, status)
  values
    (p_user_id, v_wallet, p_campaign_id, p_pix_key_id,
     jsonb_build_object('type', v_key.type, 'masked', v_key.value_masked,
                        'owner_name', v_key.owner_name),
     p_amount_cents, v_fee, v_net, 'requested')
  returning id into v_id;

  -- Reserva: AVAILABLE -> RESERVED (mesma transação).
  perform private.post_ledger_transaction(
    'wd_reserve:' || v_id, 'withdrawal', v_id, p_campaign_id,
    'Reserva de saldo para saque',
    jsonb_build_array(
      jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_AVAILABLE'),
                         'direction', 'debit',  'amount_cents', p_amount_cents),
      jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_RESERVED'),
                         'direction', 'credit', 'amount_cents', p_amount_cents)
    ));

  insert into public.withdrawal_events (withdrawal_id, actor_user_id, from_status, to_status)
  values (v_id, p_user_id, null, 'requested');

  return jsonb_build_object('ok', true, 'withdrawal_id', v_id,
                            'fee_cents', v_fee, 'net_cents', v_net);
end;
$$;

revoke all on function public.request_withdrawal(uuid, uuid, bigint, uuid, int, bigint, bigint, bigint)
  from public, anon, authenticated;

-- ------------------------------------------------------------------
-- transition_withdrawal — máquina de estados (doc §11.2) + efeitos no ledger.
-- ------------------------------------------------------------------
create or replace function public.transition_withdrawal(
  p_withdrawal_id uuid,
  p_to            public.withdrawal_status,
  p_actor_user_id uuid,
  p_actor         text,          -- 'owner' | 'staff' | 'system'
  p_reason        text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_w    public.withdrawals%rowtype;
  v_from public.withdrawal_status;
  v_allowed boolean := false;
begin
  select * into v_w from public.withdrawals where id = p_withdrawal_id for update;
  if not found then return 'not_found'; end if;
  v_from := v_w.status;
  if v_from = p_to then return 'noop'; end if;

  v_allowed := case
    when v_from = 'requested'    and p_to = 'under_review' and p_actor in ('staff','system') then true
    when v_from = 'requested'    and p_to = 'canceled'     and p_actor in ('owner','system')  then true
    when v_from = 'under_review' and p_to = 'approved'     and p_actor = 'staff'   then true
    when v_from = 'under_review' and p_to = 'rejected'     and p_actor = 'staff'   then true
    when v_from = 'under_review' and p_to = 'canceled'     and p_actor in ('owner','system') then true
    when v_from = 'approved'     and p_to = 'processing'   and p_actor = 'system'  then true
    when v_from = 'approved'     and p_to = 'rejected'     and p_actor = 'staff'   then true
    when v_from = 'approved'     and p_to = 'failed'       and p_actor = 'system'  then true
    when v_from = 'processing'   and p_to = 'paid'         and p_actor = 'system'  then true
    when v_from = 'processing'   and p_to = 'failed'       and p_actor = 'system'  then true
    else false
  end;
  if not v_allowed then
    return 'forbidden:' || v_from || '->' || p_to;
  end if;

  -- Efeitos no ledger
  if p_to = 'paid' then
    perform private.post_ledger_transaction(
      'wd_paid:' || v_w.id, 'withdrawal', v_w.id, v_w.campaign_id,
      'Saque pago via PIX Out',
      case when v_w.fee_cents > 0 then
        jsonb_build_array(
          jsonb_build_object('account_id', private.account_id(v_w.wallet_id, 'CAMPAIGN_RESERVED'),
                             'direction', 'debit',  'amount_cents', v_w.amount_cents),
          jsonb_build_object('account_id', private.account_id(null, 'CASH_PIXOUT'),
                             'direction', 'credit', 'amount_cents', v_w.net_cents),
          jsonb_build_object('account_id', private.account_id(null, 'PLATFORM_REVENUE'),
                             'direction', 'credit', 'amount_cents', v_w.fee_cents))
      else
        jsonb_build_array(
          jsonb_build_object('account_id', private.account_id(v_w.wallet_id, 'CAMPAIGN_RESERVED'),
                             'direction', 'debit',  'amount_cents', v_w.amount_cents),
          jsonb_build_object('account_id', private.account_id(null, 'CASH_PIXOUT'),
                             'direction', 'credit', 'amount_cents', v_w.net_cents))
      end);
    update public.wallet_balances
      set withdrawn_cents = withdrawn_cents + v_w.amount_cents
      where wallet_id = v_w.wallet_id;

  elsif p_to in ('rejected', 'failed', 'canceled') then
    -- Devolve a reserva ao disponível (compensatório — §28).
    perform private.post_ledger_transaction(
      'wd_release:' || v_w.id, 'withdrawal', v_w.id, v_w.campaign_id,
      'Liberação de reserva de saque',
      jsonb_build_array(
        jsonb_build_object('account_id', private.account_id(v_w.wallet_id, 'CAMPAIGN_RESERVED'),
                           'direction', 'debit',  'amount_cents', v_w.amount_cents),
        jsonb_build_object('account_id', private.account_id(v_w.wallet_id, 'CAMPAIGN_AVAILABLE'),
                           'direction', 'credit', 'amount_cents', v_w.amount_cents)
      ));
  end if;

  update public.withdrawals set
    status = p_to,
    review_started_at = case when p_to = 'under_review' then now() else review_started_at end,
    approved_at   = case when p_to = 'approved'   then now() else approved_at end,
    processing_at = case when p_to = 'processing' then now() else processing_at end,
    paid_at       = case when p_to = 'paid'       then now() else paid_at end,
    rejected_at   = case when p_to = 'rejected'   then now() else rejected_at end,
    reviewed_by   = case when p_to in ('approved','rejected') then coalesce(p_actor_user_id, reviewed_by) else reviewed_by end,
    rejection_reason = case when p_to = 'rejected' then p_reason else rejection_reason end,
    failure_reason   = case when p_to = 'failed'   then p_reason else failure_reason end
  where id = v_w.id;

  insert into public.withdrawal_events (withdrawal_id, actor_user_id, from_status, to_status, reason)
  values (v_w.id, p_actor_user_id, v_from, p_to, p_reason);

  if p_to in ('paid', 'rejected', 'failed') then
    insert into public.notifications (user_id, type, payload)
    values (v_w.user_id, 'withdrawal_' || p_to,
            jsonb_build_object('withdrawal_id', v_w.id, 'amount_cents', v_w.amount_cents,
                               'net_cents', v_w.net_cents, 'reason', p_reason));
  end if;

  return 'ok';
end;
$$;

revoke all on function public.transition_withdrawal(uuid, public.withdrawal_status, uuid, text, text)
  from public, anon, authenticated;

-- ------------------------------------------------------------------
-- confirm_withdrawal_payout — confirmação vinda da consulta autenticada ao
-- provedor (GGPix). COMPLETE→paid, FAILED/CANCELED→failed. Idempotente.
-- ------------------------------------------------------------------
create or replace function public.confirm_withdrawal_payout(
  p_provider           text,
  p_provider_reference text,
  p_provider_status    text,   -- 'complete'|'failed'|'canceled'|'pending'
  p_amount_cents       bigint,
  p_end_to_end_id      text default null,
  p_failure_reason     text default null,
  p_external_fee_cents bigint default null,
  p_raw                jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_po public.provider_payouts%rowtype;
  v_w  public.withdrawals%rowtype;
  v_r  text;
begin
  select * into v_po from public.provider_payouts
   where provider = p_provider and provider_reference = p_provider_reference for update;
  if not found then return 'not_found'; end if;

  select * into v_w from public.withdrawals where id = v_po.withdrawal_id for update;

  if lower(p_provider_status) = 'complete' then
    if v_w.status = 'paid' then return 'already_paid'; end if;
    if p_amount_cents is not null and p_amount_cents <> v_w.net_cents then
      return 'amount_mismatch';
    end if;
    v_r := public.transition_withdrawal(v_w.id, 'paid', null, 'system', null);
    update public.provider_payouts set
      status = 'paid', end_to_end_id = coalesce(p_end_to_end_id, end_to_end_id),
      external_fee_cents = coalesce(p_external_fee_cents, external_fee_cents),
      completed_at = now(), raw_last_response = p_raw
    where id = v_po.id;
    return case when v_r = 'ok' then 'paid' else v_r end;

  elsif lower(p_provider_status) in ('failed', 'canceled', 'cancelled') then
    if v_w.status = 'failed' then return 'already_failed'; end if;
    if v_w.status = 'paid' then return 'already_paid'; end if;
    v_r := public.transition_withdrawal(v_w.id, 'failed', null, 'system',
             coalesce(p_failure_reason, 'Falha no PIX Out'));
    update public.provider_payouts set
      status = 'failed', failure_reason = p_failure_reason,
      completed_at = now(), raw_last_response = p_raw
    where id = v_po.id;
    return case when v_r = 'ok' then 'failed' else v_r end;

  else
    update public.provider_payouts set status = 'pending', raw_last_response = p_raw
    where id = v_po.id;
    return 'pending';
  end if;
end;
$$;

revoke all on function public.confirm_withdrawal_payout(text, text, text, bigint, text, text, bigint, jsonb)
  from public, anon, authenticated;
