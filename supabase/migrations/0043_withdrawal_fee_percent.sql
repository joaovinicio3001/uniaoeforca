-- Taxa de saque: 3% do valor OU R$ 0,77 — o que for maior (repassa o custo do
-- PIX Out). withdrawal_fee_cents vira parcela fixa adicional (zerada agora).
alter table public.fee_rules
  add column if not exists withdrawal_fee_bps int not null default 0,
  add column if not exists withdrawal_fee_min_cents int not null default 0;

update public.fee_rules
set withdrawal_fee_bps = 300,        -- 3,00%
    withdrawal_fee_min_cents = 77,   -- R$ 0,77
    withdrawal_fee_cents = 0
where active_to is null;

-- request_withdrawal: fee = max(3% do valor, R$0,77) + parcela fixa.
create or replace function public.request_withdrawal(p_user_id uuid, p_pix_key_id uuid, p_amount_cents bigint, p_campaign_id uuid DEFAULT NULL::uuid, p_cooldown_hours integer DEFAULT 24, p_daily_max_cents bigint DEFAULT 200000000, p_min_cents bigint DEFAULT 2000, p_max_cents bigint DEFAULT 500000000, p_enhanced_kyc_cents bigint DEFAULT 200000)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_wallet uuid; v_bal public.wallet_balances%rowtype; v_key public.pix_keys%rowtype;
  v_rule public.fee_rules%rowtype;
  v_fee bigint; v_net bigint; v_id uuid; v_today_sum bigint; v_kyc jsonb; v_first boolean;
begin
  if p_amount_cents < p_min_cents then return jsonb_build_object('ok', false, 'error', 'Valor abaixo do minimo permitido.'); end if;
  if p_amount_cents > p_max_cents then return jsonb_build_object('ok', false, 'error', 'Valor acima do maximo permitido.'); end if;

  if public.is_blocklisted('user', p_user_id::text) then
    return jsonb_build_object('ok', false, 'error', 'Conta bloqueada. Contate o suporte.');
  end if;

  v_kyc := private.kyc_summary_for(p_user_id);
  if not (v_kyc->>'has_basic')::boolean then
    return jsonb_build_object('ok', false, 'error', 'Verificacao de identidade (KYC) pendente.', 'kyc_required', 'basic');
  end if;

  select not exists (select 1 from public.withdrawals where user_id = p_user_id and status in ('approved','processing','paid')) into v_first;
  if (v_first or p_amount_cents >= p_enhanced_kyc_cents) and not (v_kyc->>'has_enhanced')::boolean then
    return jsonb_build_object('ok', false, 'error', 'Este saque exige verificacao reforcada (documento + selfie).', 'kyc_required', 'enhanced');
  end if;

  v_wallet := private.ensure_wallet(p_user_id);
  select * into v_bal from public.wallet_balances where wallet_id = v_wallet for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Carteira sem saldo.'); end if;

  select * into v_key from public.pix_keys where id = p_pix_key_id and user_id = p_user_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Chave PIX nao encontrada.'); end if;
  if v_key.status <> 'verified' then return jsonb_build_object('ok', false, 'error', 'Chave PIX ainda nao verificada.'); end if;
  if v_key.created_at > now() - make_interval(hours => p_cooldown_hours) then
    return jsonb_build_object('ok', false, 'error', 'Chave PIX em periodo de seguranca (cooldown). Tente mais tarde.');
  end if;
  if (select status from public.wallets where id = v_wallet) <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'Carteira bloqueada. Contate o suporte.');
  end if;

  v_rule := public.current_fee_rule();
  v_fee := greatest(
    ceil(p_amount_cents::numeric * coalesce(v_rule.withdrawal_fee_bps, 0) / 10000)::bigint,
    coalesce(v_rule.withdrawal_fee_min_cents, 0)::bigint
  ) + coalesce(v_rule.withdrawal_fee_cents, 0);
  v_net := p_amount_cents - v_fee;
  if v_net <= 0 then return jsonb_build_object('ok', false, 'error', 'Valor nao cobre a taxa de saque.'); end if;
  if v_bal.available_cents < p_amount_cents then return jsonb_build_object('ok', false, 'error', 'Saldo disponivel insuficiente.'); end if;

  select coalesce(sum(amount_cents),0) into v_today_sum
  from public.withdrawals
  where user_id = p_user_id and status not in ('rejected','failed','canceled')
    and requested_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  if v_today_sum + p_amount_cents > p_daily_max_cents then
    return jsonb_build_object('ok', false, 'error', 'Limite diario de saque excedido.');
  end if;

  insert into public.withdrawals (user_id, wallet_id, campaign_id, pix_key_id, pix_key_snapshot, amount_cents, fee_cents, net_cents, status)
  values (p_user_id, v_wallet, p_campaign_id, p_pix_key_id,
     jsonb_build_object('type', v_key.type, 'masked', v_key.value_masked, 'owner_name', v_key.owner_name),
     p_amount_cents, v_fee, v_net, 'requested')
  returning id into v_id;

  perform private.post_ledger_transaction(
    'wd_reserve:' || v_id, 'withdrawal', v_id, p_campaign_id, 'Reserva de saldo para saque',
    jsonb_build_array(
      jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_AVAILABLE'), 'direction', 'debit',  'amount_cents', p_amount_cents),
      jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_RESERVED'),  'direction', 'credit', 'amount_cents', p_amount_cents)
    ));
  insert into public.withdrawal_events (withdrawal_id, actor_user_id, from_status, to_status)
  values (v_id, p_user_id, null, 'requested');

  perform public.assess_withdrawal_risk(v_id);

  return jsonb_build_object('ok', true, 'withdrawal_id', v_id, 'fee_cents', v_fee, 'net_cents', v_net);
end;
$function$;
