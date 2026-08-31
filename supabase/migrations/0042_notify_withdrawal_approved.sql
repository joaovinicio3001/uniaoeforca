-- Notificar o usuário também quando o saque é APROVADO (além de pago/recusado/
-- falho). Única mudança em transition_withdrawal: a condição do insert em
-- public.notifications inclui 'approved'.
create or replace function public.transition_withdrawal(p_withdrawal_id uuid, p_to withdrawal_status, p_actor_user_id uuid, p_actor text, p_reason text DEFAULT NULL::text, p_high_value_cents bigint DEFAULT NULL::bigint)
 returns text
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_w public.withdrawals%rowtype; v_from public.withdrawal_status; v_allowed boolean := false;
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
  if not v_allowed then return 'forbidden:' || v_from || '->' || p_to; end if;

  if p_to = 'approved' and p_actor = 'staff' and p_high_value_cents is not null and v_w.amount_cents > p_high_value_cents then
    if v_w.first_approved_by is null then
      update public.withdrawals set first_approved_by = p_actor_user_id, first_approved_at = now() where id = v_w.id;
      insert into public.withdrawal_events (withdrawal_id, actor_user_id, from_status, to_status, reason)
      values (v_w.id, p_actor_user_id, v_from, v_from, 'primeira aprovacao (alto valor)');
      return 'needs_second_approval';
    elsif v_w.first_approved_by = p_actor_user_id then
      return 'same_approver';
    end if;
  end if;

  if p_to = 'paid' then
    perform private.post_ledger_transaction(
      'wd_paid:' || v_w.id, 'withdrawal', v_w.id, v_w.campaign_id, 'Saque pago via PIX Out',
      case when v_w.fee_cents > 0 then
        jsonb_build_array(
          jsonb_build_object('account_id', private.account_id(v_w.wallet_id, 'CAMPAIGN_RESERVED'), 'direction', 'debit',  'amount_cents', v_w.amount_cents),
          jsonb_build_object('account_id', private.account_id(null, 'CASH_PIXOUT'),                'direction', 'credit', 'amount_cents', v_w.net_cents),
          jsonb_build_object('account_id', private.account_id(null, 'PLATFORM_REVENUE'),          'direction', 'credit', 'amount_cents', v_w.fee_cents))
      else
        jsonb_build_array(
          jsonb_build_object('account_id', private.account_id(v_w.wallet_id, 'CAMPAIGN_RESERVED'), 'direction', 'debit',  'amount_cents', v_w.amount_cents),
          jsonb_build_object('account_id', private.account_id(null, 'CASH_PIXOUT'),                'direction', 'credit', 'amount_cents', v_w.net_cents))
      end);
    update public.wallet_balances set withdrawn_cents = withdrawn_cents + v_w.amount_cents where wallet_id = v_w.wallet_id;
  elsif p_to in ('rejected', 'failed', 'canceled') then
    perform private.post_ledger_transaction(
      'wd_release:' || v_w.id, 'withdrawal', v_w.id, v_w.campaign_id, 'Liberacao de reserva de saque',
      jsonb_build_array(
        jsonb_build_object('account_id', private.account_id(v_w.wallet_id, 'CAMPAIGN_RESERVED'),  'direction', 'debit',  'amount_cents', v_w.amount_cents),
        jsonb_build_object('account_id', private.account_id(v_w.wallet_id, 'CAMPAIGN_AVAILABLE'), 'direction', 'credit', 'amount_cents', v_w.amount_cents)
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

  if p_to in ('approved', 'paid', 'rejected', 'failed') then
    insert into public.notifications (user_id, type, payload)
    values (v_w.user_id, 'withdrawal_' || p_to,
            jsonb_build_object('withdrawal_id', v_w.id, 'amount_cents', v_w.amount_cents, 'net_cents', v_w.net_cents, 'reason', p_reason));
  end if;

  return 'ok';
end;
$function$;
