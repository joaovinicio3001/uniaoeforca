-- Fase 3 — confirm_donation_payment passa a lançar no ledger de dupla entrada.
-- Continua idempotente (guarda por status + idempotency_key das transações).
--
-- Doação confirmada (doc §9.1), com gross = net + platform_fee + provider_fee:
--   D CASH_PROVIDER_IN  gross
--   C CAMPAIGN_PENDING  net             (carteira do dono da campanha)
--   C PLATFORM_REVENUE  platform_fee
--   C PROVIDER_FEES     provider_fee    (conta de acúmulo — reconciliada na Fase 6)
-- Liberação imediata (hold 0 nesta fase; holds de risco entram na Fase 5):
--   D CAMPAIGN_PENDING  net
--   C CAMPAIGN_AVAILABLE net

create or replace function public.confirm_donation_payment(
  p_provider            text,
  p_provider_reference  text,
  p_provider_status     text,
  p_amount_cents        bigint,
  p_end_to_end_id       text default null,
  p_payer_name          text default null,
  p_payer_document      text default null,
  p_raw                 jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment  public.payments%rowtype;
  v_donation public.donations%rowtype;
  v_owner    uuid;
  v_wallet   uuid;
  v_entries  jsonb;
begin
  select * into v_payment
  from public.payments
  where provider = p_provider and provider_reference = p_provider_reference
  for update;

  if not found then
    return 'not_found';
  end if;

  if p_amount_cents is not null and p_amount_cents <> v_payment.amount_cents then
    update public.payments set status = 'failed', raw_last_response = p_raw
      where id = v_payment.id and status <> 'paid';
    return 'amount_mismatch';
  end if;

  select * into v_donation from public.donations where id = v_payment.donation_id for update;

  if p_provider_status = 'paid' then
    if v_payment.status = 'paid' then
      return 'already_paid';
    end if;

    select owner_user_id into v_owner from public.campaigns where id = v_donation.campaign_id;
    v_wallet := private.ensure_wallet(v_owner);

    v_entries := jsonb_build_array(
      jsonb_build_object('account_id', private.account_id(null, 'CASH_PROVIDER_IN'),
                         'direction', 'debit',  'amount_cents', v_donation.gross_amount_cents),
      jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_PENDING'),
                         'direction', 'credit', 'amount_cents', v_donation.net_amount_cents)
    );
    if v_donation.platform_fee_cents > 0 then
      v_entries := v_entries || jsonb_build_object(
        'account_id', private.account_id(null, 'PLATFORM_REVENUE'),
        'direction', 'credit', 'amount_cents', v_donation.platform_fee_cents);
    end if;
    if v_donation.provider_fee_cents > 0 then
      v_entries := v_entries || jsonb_build_object(
        'account_id', private.account_id(null, 'PROVIDER_FEES'),
        'direction', 'credit', 'amount_cents', v_donation.provider_fee_cents);
    end if;

    perform private.post_ledger_transaction(
      'donation:' || v_donation.id, 'donation', v_donation.id, v_donation.campaign_id,
      'Doação confirmada', v_entries);

    perform private.post_ledger_transaction(
      'release:' || v_donation.id, 'donation_release', v_donation.id, v_donation.campaign_id,
      'Liberação para saque',
      jsonb_build_array(
        jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_PENDING'),
                           'direction', 'debit',  'amount_cents', v_donation.net_amount_cents),
        jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_AVAILABLE'),
                           'direction', 'credit', 'amount_cents', v_donation.net_amount_cents)
      ));

    update public.payments set
      status = 'paid',
      end_to_end_id = coalesce(p_end_to_end_id, end_to_end_id),
      payer_name = coalesce(p_payer_name, payer_name),
      payer_document = coalesce(p_payer_document, payer_document),
      paid_at = now(),
      raw_last_response = p_raw
    where id = v_payment.id;

    update public.donations set status = 'paid', paid_at = now() where id = v_donation.id;

    update public.campaigns set
      raised_amount_cents = raised_amount_cents + v_donation.net_amount_cents,
      supporters_count = supporters_count + 1
    where id = v_donation.campaign_id;

    insert into public.notifications (user_id, type, payload)
    values (v_owner, 'donation_confirmed',
            jsonb_build_object('campaign_id', v_donation.campaign_id,
                               'donation_id', v_donation.id,
                               'net_amount_cents', v_donation.net_amount_cents));

    return 'credited';

  elsif p_provider_status in ('expired') then
    if v_payment.status <> 'paid' then
      update public.payments set status = 'expired', raw_last_response = p_raw where id = v_payment.id;
      update public.donations set status = 'expired' where id = v_donation.id;
    end if;
    return 'updated';

  elsif p_provider_status in ('canceled', 'cancelled', 'failed') then
    if v_payment.status <> 'paid' then
      update public.payments set status = 'failed', raw_last_response = p_raw where id = v_payment.id;
      update public.donations set status = 'failed' where id = v_donation.id;
    end if;
    return 'updated';

  else
    if v_payment.status = 'created' then
      update public.payments set status = 'pending', raw_last_response = p_raw where id = v_payment.id;
      update public.donations set status = 'pending' where id = v_donation.id;
    end if;
    return 'updated';
  end if;
end;
$$;

revoke all on function public.confirm_donation_payment(text, text, text, bigint, text, text, text, jsonb)
  from public, anon, authenticated;
