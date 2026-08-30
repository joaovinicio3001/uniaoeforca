-- Fase 3 — RLS do ledger (doc §10, §34.7). Somente leitura para o cliente.
-- Nenhuma escrita: tudo passa por private.post_ledger_transaction (SECURITY DEFINER).

alter table public.wallets              enable row level security;
alter table public.ledger_accounts      enable row level security;
alter table public.ledger_transactions  enable row level security;
alter table public.ledger_entries       enable row level security;
alter table public.wallet_balances      enable row level security;

revoke all on public.wallets             from anon, authenticated;
revoke all on public.ledger_accounts     from anon, authenticated;
revoke all on public.ledger_transactions from anon, authenticated;
revoke all on public.ledger_entries      from anon, authenticated;
revoke all on public.wallet_balances     from anon, authenticated;

grant select on public.wallets             to authenticated;
grant select on public.ledger_accounts     to authenticated;
grant select on public.ledger_transactions to authenticated;
grant select on public.ledger_entries      to authenticated;
grant select on public.wallet_balances     to authenticated;
grant select on public.v_ledger_trial_balance to authenticated;

-- wallets: dono + staff
drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists wallets_select_staff on public.wallets;
create policy wallets_select_staff on public.wallets
  for select to authenticated using (private.is_staff((select auth.uid())));

-- wallet_balances: dono + staff
drop policy if exists wallet_balances_select_own on public.wallet_balances;
create policy wallet_balances_select_own on public.wallet_balances
  for select to authenticated using (
    exists (select 1 from public.wallets w
            where w.id = wallet_balances.wallet_id and w.user_id = (select auth.uid()))
  );
drop policy if exists wallet_balances_select_staff on public.wallet_balances;
create policy wallet_balances_select_staff on public.wallet_balances
  for select to authenticated using (private.is_staff((select auth.uid())));

-- ledger_accounts: globais visíveis a todo autenticado; por-carteira só do dono; staff tudo
drop policy if exists ledger_accounts_select_global on public.ledger_accounts;
create policy ledger_accounts_select_global on public.ledger_accounts
  for select to authenticated using (wallet_id is null);
drop policy if exists ledger_accounts_select_own on public.ledger_accounts;
create policy ledger_accounts_select_own on public.ledger_accounts
  for select to authenticated using (
    exists (select 1 from public.wallets w
            where w.id = ledger_accounts.wallet_id and w.user_id = (select auth.uid()))
  );
drop policy if exists ledger_accounts_select_staff on public.ledger_accounts;
create policy ledger_accounts_select_staff on public.ledger_accounts
  for select to authenticated using (private.is_staff((select auth.uid())));

-- ledger_transactions: dono da campanha referenciada + staff
drop policy if exists ledger_tx_select_owner on public.ledger_transactions;
create policy ledger_tx_select_owner on public.ledger_transactions
  for select to authenticated using (
    campaign_id is not null
    and private.owns_campaign((select auth.uid()), campaign_id)
  );
drop policy if exists ledger_tx_select_staff on public.ledger_transactions;
create policy ledger_tx_select_staff on public.ledger_transactions
  for select to authenticated using (private.is_staff((select auth.uid())));

-- ledger_entries: via conta da carteira do usuário + staff
drop policy if exists ledger_entries_select_own on public.ledger_entries;
create policy ledger_entries_select_own on public.ledger_entries
  for select to authenticated using (
    exists (
      select 1 from public.ledger_accounts a
      join public.wallets w on w.id = a.wallet_id
      where a.id = ledger_entries.account_id and w.user_id = (select auth.uid())
    )
  );
drop policy if exists ledger_entries_select_staff on public.ledger_entries;
create policy ledger_entries_select_staff on public.ledger_entries
  for select to authenticated using (private.is_staff((select auth.uid())));
