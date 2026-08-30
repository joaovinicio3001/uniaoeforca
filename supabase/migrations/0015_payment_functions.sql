-- Fase 2 — funções transacionais de pagamento (doc §8.2, §8.3, §20, §28).
--
-- confirm_donation_payment: unidade atômica e idempotente. Recebe SEMPRE dados
-- já validados contra a consulta autenticada ao provedor (server-to-server) —
-- nunca o corpo cru do webhook (doc §8.3 "regra de ouro").

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
begin
  select * into v_payment
  from public.payments
  where provider = p_provider and provider_reference = p_provider_reference
  for update;

  if not found then
    return 'not_found';
  end if;

  -- Confere valor: divergência nunca credita (doc §20 assert payment.amount == event.amount).
  if p_amount_cents is not null and p_amount_cents <> v_payment.amount_cents then
    update public.payments
      set status = 'failed',
          raw_last_response = p_raw
      where id = v_payment.id and status <> 'paid';
    return 'amount_mismatch';
  end if;

  select * into v_donation from public.donations where id = v_payment.donation_id for update;

  if p_provider_status = 'paid' then
    if v_payment.status = 'paid' then
      return 'already_paid';
    end if;

    update public.payments set
      status = 'paid',
      end_to_end_id = coalesce(p_end_to_end_id, end_to_end_id),
      payer_name = coalesce(p_payer_name, payer_name),
      payer_document = coalesce(p_payer_document, payer_document),
      paid_at = now(),
      raw_last_response = p_raw
    where id = v_payment.id;

    update public.donations set status = 'paid', paid_at = now()
    where id = v_donation.id;

    update public.campaigns set
      raised_amount_cents = raised_amount_cents + v_donation.net_amount_cents,
      supporters_count = supporters_count + 1
    where id = v_donation.campaign_id;

    insert into public.notifications (user_id, type, payload)
    select owner_user_id, 'donation_confirmed',
           jsonb_build_object('campaign_id', v_donation.campaign_id,
                              'donation_id', v_donation.id,
                              'net_amount_cents', v_donation.net_amount_cents)
    from public.campaigns where id = v_donation.campaign_id;

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

-- ------------------------------------------------------------------
-- Apoiadores públicos de uma campanha (não anônimos, pagos). Doc §5.
-- ------------------------------------------------------------------
create or replace function public.get_campaign_supporters(p_campaign_id uuid, p_limit int default 20)
returns table (display_name text, amount_cents bigint, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select coalesce(nullif(trim(d.donor_name), ''), 'Apoiador'),
         d.gross_amount_cents,
         d.paid_at
  from public.donations d
  where d.campaign_id = p_campaign_id
    and d.status = 'paid'
    and d.anonymous = false
  order by d.paid_at desc nulls last
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.get_campaign_supporters(uuid, int) from public;
grant execute on function public.get_campaign_supporters(uuid, int) to anon, authenticated;
