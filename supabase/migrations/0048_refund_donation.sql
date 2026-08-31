-- Estorno de doação confirmada (doc §11). Reverte os lançamentos da doação e da
-- liberação, devolve a receita da plataforma e o custo do provedor, atualiza os
-- contadores da campanha e registra o estorno. A devolução PIX ao doador é
-- operacional (provider_refunded controla o acompanhamento).
create table if not exists public.refunds (
  id                uuid primary key default gen_random_uuid(),
  donation_id       uuid not null references public.donations (id),
  amount_cents      bigint not null,
  reason            text not null,
  actor_user_id     uuid references auth.users (id),
  provider_refunded boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (donation_id)
);

alter table public.refunds enable row level security;
comment on table public.refunds is 'Estornos de doações confirmadas.';

create or replace function public.refund_donation(
  p_donation_id uuid,
  p_actor       uuid,
  p_reason      text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_don     public.donations%rowtype;
  v_owner   uuid;
  v_wallet  uuid;
  v_bal     public.wallet_balances%rowtype;
  v_entries jsonb;
begin
  select * into v_don from public.donations where id = p_donation_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Doação não encontrada.');
  end if;
  if v_don.status <> 'paid' then
    return jsonb_build_object('ok', false, 'error', 'Só é possível estornar uma doação paga.');
  end if;

  select owner_user_id into v_owner from public.campaigns where id = v_don.campaign_id;
  v_wallet := private.ensure_wallet(v_owner);

  select * into v_bal from public.wallet_balances where wallet_id = v_wallet for update;
  if coalesce(v_bal.available_cents, 0) < v_don.net_amount_cents then
    return jsonb_build_object(
      'ok', false,
      'error', 'O saldo disponível da campanha é menor que o valor a estornar. Bloqueie a campanha e trate manualmente.'
    );
  end if;

  -- 1) reverte a liberação: AVAILABLE -> PENDING
  perform private.post_ledger_transaction(
    'refund_release:' || v_don.id, 'donation_refund', v_don.id, v_don.campaign_id,
    'Estorno — reversão da liberação',
    jsonb_build_array(
      jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_AVAILABLE'),
                         'direction', 'debit',  'amount_cents', v_don.net_amount_cents),
      jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_PENDING'),
                         'direction', 'credit', 'amount_cents', v_don.net_amount_cents)
    ));

  -- 2) reverte a doação: PENDING + PLATFORM_REVENUE + PROVIDER_FEES -> CASH_PROVIDER_IN
  v_entries := jsonb_build_array(
    jsonb_build_object('account_id', private.account_id(v_wallet, 'CAMPAIGN_PENDING'),
                       'direction', 'debit',  'amount_cents', v_don.net_amount_cents),
    jsonb_build_object('account_id', private.account_id(null, 'CASH_PROVIDER_IN'),
                       'direction', 'credit', 'amount_cents', v_don.gross_amount_cents)
  );
  if v_don.platform_fee_cents > 0 then
    v_entries := v_entries || jsonb_build_object(
      'account_id', private.account_id(null, 'PLATFORM_REVENUE'),
      'direction', 'debit', 'amount_cents', v_don.platform_fee_cents);
  end if;
  if v_don.provider_fee_cents > 0 then
    v_entries := v_entries || jsonb_build_object(
      'account_id', private.account_id(null, 'PROVIDER_FEES'),
      'direction', 'debit', 'amount_cents', v_don.provider_fee_cents);
  end if;

  perform private.post_ledger_transaction(
    'refund_donation:' || v_don.id, 'donation_refund', v_don.id, v_don.campaign_id,
    'Estorno de doação', v_entries);

  update public.donations set status = 'refunded' where id = v_don.id;
  update public.payments set status = 'refunded' where donation_id = v_don.id;
  update public.campaigns set
    raised_amount_cents = greatest(0, raised_amount_cents - v_don.net_amount_cents),
    supporters_count    = greatest(0, supporters_count - 1)
  where id = v_don.campaign_id;

  insert into public.refunds (donation_id, amount_cents, reason, actor_user_id)
  values (v_don.id, v_don.gross_amount_cents, coalesce(p_reason, ''), p_actor)
  on conflict (donation_id) do nothing;

  insert into public.notifications (user_id, type, payload)
  values (v_owner, 'donation_refunded',
          jsonb_build_object('campaign_id', v_don.campaign_id,
                             'donation_id', v_don.id,
                             'amount_cents', v_don.gross_amount_cents));
  if v_don.donor_user_id is not null then
    insert into public.notifications (user_id, type, payload)
    values (v_don.donor_user_id, 'donation_refunded',
            jsonb_build_object('campaign_id', v_don.campaign_id,
                               'donation_id', v_don.id,
                               'amount_cents', v_don.gross_amount_cents));
  end if;

  return jsonb_build_object('ok', true, 'amount_cents', v_don.gross_amount_cents);
end;
$$;

revoke all on function public.refund_donation(uuid, uuid, text) from public, anon, authenticated;
