-- Fase 2 — RLS de doações/pagamentos (doc §34.7).
-- Toda criação de doação/pagamento e todo processamento de webhook passam por
-- server actions / route handlers com service_role. O cliente só LÊ o que lhe diz respeito.

alter table public.fee_rules      enable row level security;
alter table public.donations      enable row level security;
alter table public.payments       enable row level security;
alter table public.webhook_events enable row level security;

revoke all on public.donations      from anon, authenticated;
revoke all on public.payments       from anon, authenticated;
revoke all on public.webhook_events from anon, authenticated;

-- ---------- fee_rules: preço é público (doc §9 "exibido com transparência") ----------
grant select on public.fee_rules to anon, authenticated;
drop policy if exists fee_rules_select_all on public.fee_rules;
create policy fee_rules_select_all on public.fee_rules
  for select using (true);
-- Escrita só service_role (painel admin — Fase 6).

-- ---------- donations ----------
grant select on public.donations to authenticated;

drop policy if exists donations_select_own on public.donations;
create policy donations_select_own on public.donations
  for select to authenticated
  using (donor_user_id = (select auth.uid()));

drop policy if exists donations_select_campaign_owner on public.donations;
create policy donations_select_campaign_owner on public.donations
  for select to authenticated
  using (private.owns_campaign((select auth.uid()), campaign_id));

drop policy if exists donations_select_staff on public.donations;
create policy donations_select_staff on public.donations
  for select to authenticated
  using (private.is_staff((select auth.uid())));

-- ---------- payments ----------
grant select on public.payments to authenticated;

drop policy if exists payments_select_staff on public.payments;
create policy payments_select_staff on public.payments
  for select to authenticated
  using (private.is_staff((select auth.uid())));

drop policy if exists payments_select_donor on public.payments;
create policy payments_select_donor on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.donations d
      where d.id = payments.donation_id
        and (d.donor_user_id = (select auth.uid())
             or private.owns_campaign((select auth.uid()), d.campaign_id))
    )
  );

-- ---------- webhook_events: só staff lê ----------
grant select on public.webhook_events to authenticated;
drop policy if exists webhook_events_select_staff on public.webhook_events;
create policy webhook_events_select_staff on public.webhook_events
  for select to authenticated
  using (private.is_staff((select auth.uid())));
