-- Fase 4 — RLS de saques (doc §34.7). Só leitura pelo cliente; escrita via
-- service_role / funções SECURITY DEFINER.

alter table public.pix_keys          enable row level security;
alter table public.withdrawals       enable row level security;
alter table public.provider_payouts  enable row level security;
alter table public.withdrawal_events enable row level security;

revoke all on public.pix_keys          from anon, authenticated;
revoke all on public.withdrawals       from anon, authenticated;
revoke all on public.provider_payouts  from anon, authenticated;
revoke all on public.withdrawal_events from anon, authenticated;

grant select on public.pix_keys          to authenticated;
grant select on public.withdrawals       to authenticated;
grant select on public.provider_payouts  to authenticated;
grant select on public.withdrawal_events to authenticated;

-- pix_keys: dono lê as suas (value_encrypted nunca é útil ao cliente, mas o
-- valor real só é decifrado server-side); staff lê todas.
drop policy if exists pix_keys_select_own on public.pix_keys;
create policy pix_keys_select_own on public.pix_keys
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists pix_keys_select_staff on public.pix_keys;
create policy pix_keys_select_staff on public.pix_keys
  for select to authenticated using (private.is_staff((select auth.uid())));

-- withdrawals
drop policy if exists withdrawals_select_own on public.withdrawals;
create policy withdrawals_select_own on public.withdrawals
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists withdrawals_select_staff on public.withdrawals;
create policy withdrawals_select_staff on public.withdrawals
  for select to authenticated using (private.is_staff((select auth.uid())));

-- provider_payouts: só staff
drop policy if exists provider_payouts_select_staff on public.provider_payouts;
create policy provider_payouts_select_staff on public.provider_payouts
  for select to authenticated using (private.is_staff((select auth.uid())));

-- withdrawal_events: dono (via withdrawal) + staff
drop policy if exists withdrawal_events_select_own on public.withdrawal_events;
create policy withdrawal_events_select_own on public.withdrawal_events
  for select to authenticated using (
    exists (select 1 from public.withdrawals w
            where w.id = withdrawal_events.withdrawal_id and w.user_id = (select auth.uid()))
  );
drop policy if exists withdrawal_events_select_staff on public.withdrawal_events;
create policy withdrawal_events_select_staff on public.withdrawal_events
  for select to authenticated using (private.is_staff((select auth.uid())));
