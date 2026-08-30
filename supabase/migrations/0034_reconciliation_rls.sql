-- Fase 6 — RLS de conciliação (staff apenas).
alter table public.reconciliation_runs  enable row level security;
alter table public.reconciliation_items enable row level security;

revoke all on public.reconciliation_runs  from anon, authenticated;
revoke all on public.reconciliation_items from anon, authenticated;

grant select on public.reconciliation_runs  to authenticated;
grant select on public.reconciliation_items to authenticated;

drop policy if exists recon_runs_select_staff on public.reconciliation_runs;
create policy recon_runs_select_staff on public.reconciliation_runs
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists recon_items_select_staff on public.reconciliation_items;
create policy recon_items_select_staff on public.reconciliation_items
  for select to authenticated using (private.is_staff((select auth.uid())));
