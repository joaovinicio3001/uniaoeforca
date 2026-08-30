-- 0037: "arrecadado" da campanha passa a refletir o VALOR BRUTO doado
-- (o que o doador pagou), não o líquido pós-taxa.
--
-- Motivo: é o comportamento esperado numa vaquinha — a página mostra o total
-- arrecadado; as taxas aparecem em /taxas e no extrato. O saldo sacável do
-- criador continua sendo o líquido, mantido pelo ledger em wallet_balances
-- (nada aqui muda o ledger nem o quanto o criador pode sacar).

create or replace function public.confirm_donation_payment(
  p_provider text, p_provider_reference text, p_provider_status text,
  p_amount_cents bigint, p_end_to_end_id text default null::text,
  p_payer_name text default null::text, p_payer_document text default null::text,
  p_raw jsonb default '{}'::jsonb)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
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
      'Doacao confirmada', v_entries);

    perform private.post_ledger_transaction(
      'release:' || v_donation.id, 'donation_release', v_donation.id, v_donation.campaign_id,
      'Liberacao para saque',
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
      raised_amount_cents = raised_amount_cents + v_donation.gross_amount_cents,
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
$function$;

-- Recalcula a projeção de todas as campanhas a partir do bruto das doações pagas.
update public.campaigns c set
  raised_amount_cents = coalesce((
    select sum(d.gross_amount_cents)
    from public.donations d
    where d.campaign_id = c.id and d.status = 'paid'
  ), 0),
  supporters_count = coalesce((
    select count(*)
    from public.donations d
    where d.campaign_id = c.id and d.status = 'paid'
  ), 0);

comment on table public.campaigns is
  'Campanhas de arrecadação (doc §7). raised_amount_cents = total BRUTO doado (o que os doadores pagaram); supporters_count = doações pagas. O saldo sacável (líquido) vive no ledger / wallet_balances.';
