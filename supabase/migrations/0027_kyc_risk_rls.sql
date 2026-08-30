-- Fase 5 — RLS de KYC/risco (doc §34.7). Cliente só lê o que lhe diz respeito;
-- escrita via SECURITY DEFINER / service_role.

alter table public.kyc_cases          enable row level security;
alter table public.kyc_documents      enable row level security;
alter table public.risk_flags         enable row level security;
alter table public.account_ip_signals enable row level security;
alter table public.blocklist          enable row level security;
alter table public.wallet_holds       enable row level security;

revoke all on public.kyc_cases          from anon, authenticated;
revoke all on public.kyc_documents      from anon, authenticated;
revoke all on public.risk_flags         from anon, authenticated;
revoke all on public.account_ip_signals from anon, authenticated;
revoke all on public.blocklist          from anon, authenticated;
revoke all on public.wallet_holds       from anon, authenticated;

grant select on public.kyc_cases     to authenticated;
grant select on public.risk_flags    to authenticated;
grant select on public.wallet_holds  to authenticated;

-- kyc_cases: dono vê os seus; staff vê todos
drop policy if exists kyc_cases_select_own on public.kyc_cases;
create policy kyc_cases_select_own on public.kyc_cases
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists kyc_cases_select_staff on public.kyc_cases;
create policy kyc_cases_select_staff on public.kyc_cases
  for select to authenticated using (private.is_staff((select auth.uid())));

-- kyc_documents: nunca para o cliente (só service_role gera URL assinada)
-- (sem grant, sem policy → negado)

-- risk_flags: só staff
drop policy if exists risk_flags_select_staff on public.risk_flags;
create policy risk_flags_select_staff on public.risk_flags
  for select to authenticated using (private.is_staff((select auth.uid())));

-- account_ip_signals / blocklist: nada para o cliente

-- wallet_holds: dono da carteira + staff
drop policy if exists wallet_holds_select_own on public.wallet_holds;
create policy wallet_holds_select_own on public.wallet_holds
  for select to authenticated using (
    exists (select 1 from public.wallets w
            where w.id = wallet_holds.wallet_id and w.user_id = (select auth.uid()))
  );
drop policy if exists wallet_holds_select_staff on public.wallet_holds;
create policy wallet_holds_select_staff on public.wallet_holds
  for select to authenticated using (private.is_staff((select auth.uid())));
