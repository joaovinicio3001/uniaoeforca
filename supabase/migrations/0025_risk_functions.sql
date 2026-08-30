-- Fase 5 — funções de KYC, risco e holds (doc §14).

-- ------------------------------------------------------------------
-- Sinais e blocklist
-- ------------------------------------------------------------------
create or replace function private.record_ip_signal(p_user_id uuid, p_ip_hash text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_ip_hash is null or p_ip_hash = '' then return; end if;
  insert into public.account_ip_signals (user_id, ip_hash)
  values (p_user_id, p_ip_hash)
  on conflict (user_id, ip_hash)
  do update set last_seen_at = now(), hits = public.account_ip_signals.hits + 1;
end;
$$;

create or replace function public.is_blocklisted(p_type public.blocklist_entity, p_value text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocklist
    where active and entity_type = p_type and entity_value = p_value
  );
$$;
revoke all on function public.is_blocklisted(public.blocklist_entity, text) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- KYC
-- ------------------------------------------------------------------
create or replace function public.user_kyc_summary(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'has_basic', exists (select 1 from public.kyc_cases
                         where user_id = p_user_id and level = 'basic'
                           and status = 'approved'
                           and (expires_at is null or expires_at > now())),
    'has_enhanced', exists (select 1 from public.kyc_cases
                            where user_id = p_user_id and level = 'enhanced'
                              and status = 'approved'
                              and (expires_at is null or expires_at > now())),
    'latest_status', (select status from public.kyc_cases
                      where user_id = p_user_id order by submitted_at desc limit 1)
  );
$$;
revoke all on function public.user_kyc_summary(uuid) from public, anon;
grant execute on function public.user_kyc_summary(uuid) to authenticated;

/**
 * KYC básico: confere consistência dos dados com o profile. Sem PSP externo
 * nesta fase — verificação documental real é `enhanced` + análise manual.
 */
create or replace function public.submit_basic_kyc(
  p_user_id uuid, p_full_name text, p_birth_date date, p_cpf_hash text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_p public.profiles%rowtype;
  v_match boolean;
  v_id uuid;
  v_status public.kyc_status;
begin
  if public.is_blocklisted('user', p_user_id::text) then
    return jsonb_build_object('ok', false, 'error', 'Conta bloqueada.');
  end if;

  select * into v_p from public.profiles where id = p_user_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Perfil não encontrado.'); end if;

  v_match :=
    lower(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'))
      = lower(regexp_replace(coalesce(v_p.full_name, ''), '\s+', ' ', 'g'))
    and p_birth_date is not distinct from v_p.birth_date
    and (v_p.cpf_hash is null or p_cpf_hash = v_p.cpf_hash);

  v_status := case when v_match then 'approved'::public.kyc_status else 'in_review'::public.kyc_status end;

  insert into public.kyc_cases
    (user_id, level, status, full_name_submitted, birth_date_submitted, cpf_hash_submitted,
     risk_level, approved_at, expires_at)
  values
    (p_user_id, 'basic', v_status, p_full_name, p_birth_date, p_cpf_hash,
     'low',
     case when v_match then now() end,
     case when v_match then now() + interval '365 days' end)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'case_id', v_id, 'status', v_status,
                            'auto_approved', v_match);
end;
$$;
revoke all on function public.submit_basic_kyc(uuid, text, date, text) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- Holds de saldo
-- ------------------------------------------------------------------
create or replace function public.place_wallet_hold(
  p_wallet_id uuid, p_amount_cents bigint, p_reason text, p_actor uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_bal public.wallet_balances%rowtype; v_id uuid;
begin
  select * into v_bal from public.wallet_balances where wallet_id = p_wallet_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Carteira não encontrada.'); end if;
  if p_amount_cents <= 0 or p_amount_cents > v_bal.available_cents then
    return jsonb_build_object('ok', false, 'error', 'Valor maior que o disponível.');
  end if;

  insert into public.wallet_holds (wallet_id, amount_cents, reason, created_by)
  values (p_wallet_id, p_amount_cents, p_reason, p_actor) returning id into v_id;

  perform private.post_ledger_transaction(
    'hold:' || v_id, 'wallet_hold', v_id, null, 'Bloqueio temporário de saldo (risco)',
    jsonb_build_array(
      jsonb_build_object('account_id', private.account_id(p_wallet_id, 'CAMPAIGN_AVAILABLE'), 'direction', 'debit',  'amount_cents', p_amount_cents),
      jsonb_build_object('account_id', private.account_id(p_wallet_id, 'CAMPAIGN_HELD'),      'direction', 'credit', 'amount_cents', p_amount_cents)
    ));
  return jsonb_build_object('ok', true, 'hold_id', v_id);
end;
$$;
revoke all on function public.place_wallet_hold(uuid, bigint, text, uuid) from public, anon, authenticated;

create or replace function public.release_wallet_hold(p_hold_id uuid, p_actor uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_h public.wallet_holds%rowtype;
begin
  select * into v_h from public.wallet_holds where id = p_hold_id for update;
  if not found then return 'not_found'; end if;
  if v_h.status = 'released' then return 'already_released'; end if;

  perform private.post_ledger_transaction(
    'hold_release:' || v_h.id, 'wallet_hold', v_h.id, null, 'Liberação de bloqueio de saldo',
    jsonb_build_array(
      jsonb_build_object('account_id', private.account_id(v_h.wallet_id, 'CAMPAIGN_HELD'),      'direction', 'debit',  'amount_cents', v_h.amount_cents),
      jsonb_build_object('account_id', private.account_id(v_h.wallet_id, 'CAMPAIGN_AVAILABLE'), 'direction', 'credit', 'amount_cents', v_h.amount_cents)
    ));
  update public.wallet_holds set status = 'released', released_by = p_actor, released_at = now()
  where id = v_h.id;
  return 'ok';
end;
$$;
revoke all on function public.release_wallet_hold(uuid, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- Avaliação de risco de um saque (doc §14 velocity checks)
-- ------------------------------------------------------------------
create or replace function public.assess_withdrawal_risk(
  p_withdrawal_id     uuid,
  p_vel_count_24h     int    default 3,
  p_vel_sum_24h_cents bigint default 300000,
  p_unusual_cents     bigint default 500000,
  p_critical_cents    bigint default 2000000,
  p_fast_hours        int    default 24
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_w public.withdrawals%rowtype;
  v_cnt int; v_sum bigint; v_pub timestamptz; v_max_sev public.risk_severity := 'info';
  v_added int := 0;
  procedure_flag record;
begin
  select * into v_w from public.withdrawals where id = p_withdrawal_id;
  if not found then return jsonb_build_object('ok', false); end if;

  -- blocklist
  if public.is_blocklisted('user', v_w.user_id::text) then
    insert into public.risk_flags (type, severity, user_id, withdrawal_id, details)
    values ('blocklist_hit', 'critical', v_w.user_id, v_w.id, '{}'::jsonb);
    v_max_sev := 'critical'; v_added := v_added + 1;
  end if;

  -- velocity 24h
  select count(*), coalesce(sum(amount_cents), 0) into v_cnt, v_sum
  from public.withdrawals
  where user_id = v_w.user_id and status not in ('rejected', 'failed', 'canceled')
    and requested_at >= now() - interval '24 hours';
  if v_cnt > p_vel_count_24h or v_sum > p_vel_sum_24h_cents then
    insert into public.risk_flags (type, severity, user_id, withdrawal_id, details)
    values ('velocity_withdrawals',
            case when v_sum > p_critical_cents then 'critical' else 'warning' end,
            v_w.user_id, v_w.id,
            jsonb_build_object('count_24h', v_cnt, 'sum_24h_cents', v_sum));
    v_added := v_added + 1;
    if v_sum > p_critical_cents then v_max_sev := 'critical';
    elsif v_max_sev <> 'critical' then v_max_sev := 'warning'; end if;
  end if;

  -- valor incomum
  if v_w.amount_cents >= p_critical_cents then
    insert into public.risk_flags (type, severity, user_id, withdrawal_id, details)
    values ('unusual_amount', 'critical', v_w.user_id, v_w.id,
            jsonb_build_object('amount_cents', v_w.amount_cents));
    v_max_sev := 'critical'; v_added := v_added + 1;
  elsif v_w.amount_cents >= p_unusual_cents then
    insert into public.risk_flags (type, severity, user_id, withdrawal_id, details)
    values ('unusual_amount', 'warning', v_w.user_id, v_w.id,
            jsonb_build_object('amount_cents', v_w.amount_cents));
    v_added := v_added + 1;
    if v_max_sev = 'info' then v_max_sev := 'warning'; end if;
  end if;

  -- criação -> saque muito rápido
  if v_w.campaign_id is not null then
    select published_at into v_pub from public.campaigns where id = v_w.campaign_id;
    if v_pub is not null and v_w.requested_at - v_pub < make_interval(hours => p_fast_hours) then
      insert into public.risk_flags (type, severity, user_id, campaign_id, withdrawal_id, details)
      values ('fast_create_withdraw', 'warning', v_w.user_id, v_w.campaign_id, v_w.id,
              jsonb_build_object('hours_since_publish',
                extract(epoch from (v_w.requested_at - v_pub)) / 3600));
      v_added := v_added + 1;
      if v_max_sev = 'info' then v_max_sev := 'warning'; end if;
    end if;
  end if;

  -- múltiplas contas por IP
  for procedure_flag in
    select distinct s2.user_id
    from public.account_ip_signals s1
    join public.account_ip_signals s2 on s2.ip_hash = s1.ip_hash and s2.user_id <> s1.user_id
    where s1.user_id = v_w.user_id
    limit 5
  loop
    insert into public.risk_flags (type, severity, user_id, withdrawal_id, details)
    values ('multi_account_ip', 'warning', v_w.user_id, v_w.id,
            jsonb_build_object('related_user', procedure_flag.user_id));
    v_added := v_added + 1;
    if v_max_sev = 'info' then v_max_sev := 'warning'; end if;
  end loop;

  return jsonb_build_object('ok', true, 'flags_added', v_added, 'max_severity', v_max_sev);
end;
$$;
revoke all on function public.assess_withdrawal_risk(uuid, int, bigint, bigint, bigint, int)
  from public, anon, authenticated;
