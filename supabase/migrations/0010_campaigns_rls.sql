-- Fase 1 — RLS das tabelas de campanha (doc §34.7, deny-by-default).
--
-- Visibilidade pública = status in ('active','completed') AND visibility <> 'private'.
-- Dono enxerga/edita a própria campanha em qualquer status.
-- Staff enxerga tudo; escrita de status/moderação é feita via service_role
-- (server actions administrativas auditadas) — sem policy de UPDATE para staff aqui.

alter table public.categories                  enable row level security;
alter table public.campaigns                   enable row level security;
alter table public.campaign_media              enable row level security;
alter table public.campaign_updates            enable row level security;
alter table public.campaign_slug_redirects     enable row level security;
alter table public.reports                     enable row level security;
alter table public.campaign_moderation_events  enable row level security;

revoke all on public.campaigns                  from anon;
revoke all on public.campaign_media             from anon;
revoke all on public.campaign_updates           from anon;
revoke all on public.reports                    from anon;
revoke all on public.campaign_moderation_events from anon;

-- ---------------- categories (leitura pública) ----------------
grant select on public.categories to anon, authenticated;
drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories
  for select using (active or private.is_staff(auth.uid()));

-- ---------------- campaigns ----------------
grant select on public.campaigns to anon, authenticated;
grant insert, update on public.campaigns to authenticated;

drop policy if exists campaigns_select_public on public.campaigns;
create policy campaigns_select_public on public.campaigns
  for select
  using (status in ('active', 'completed') and visibility <> 'private');

drop policy if exists campaigns_select_owner on public.campaigns;
create policy campaigns_select_owner on public.campaigns
  for select to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists campaigns_select_staff on public.campaigns;
create policy campaigns_select_staff on public.campaigns
  for select to authenticated
  using (private.is_staff(auth.uid()));

-- Criação: só o próprio usuário como dono e sempre começando em draft.
drop policy if exists campaigns_insert_owner on public.campaigns;
create policy campaigns_insert_owner on public.campaigns
  for insert to authenticated
  with check (owner_user_id = auth.uid() and status = 'draft');

-- Edição pelo dono: apenas enquanto rascunho/reprovada. Transições de estado e
-- edição de campanha publicada passam por server action (service_role) que
-- valida a máquina de estados e grava auditoria.
drop policy if exists campaigns_update_owner on public.campaigns;
create policy campaigns_update_owner on public.campaigns
  for update to authenticated
  using (owner_user_id = auth.uid() and status in ('draft', 'rejected'))
  with check (owner_user_id = auth.uid() and status in ('draft', 'rejected'));

-- ---------------- campaign_media ----------------
grant select on public.campaign_media to anon, authenticated;
grant insert, update, delete on public.campaign_media to authenticated;

drop policy if exists campaign_media_select_public on public.campaign_media;
create policy campaign_media_select_public on public.campaign_media
  for select using (private.campaign_is_public(campaign_id));

drop policy if exists campaign_media_rw_owner on public.campaign_media;
create policy campaign_media_rw_owner on public.campaign_media
  for all to authenticated
  using (private.owns_campaign(auth.uid(), campaign_id))
  with check (private.owns_campaign(auth.uid(), campaign_id));

drop policy if exists campaign_media_select_staff on public.campaign_media;
create policy campaign_media_select_staff on public.campaign_media
  for select to authenticated
  using (private.is_staff(auth.uid()));

-- ---------------- campaign_updates ----------------
grant select on public.campaign_updates to anon, authenticated;
grant insert, update, delete on public.campaign_updates to authenticated;

drop policy if exists campaign_updates_select_public on public.campaign_updates;
create policy campaign_updates_select_public on public.campaign_updates
  for select
  using (published_at is not null and private.campaign_is_public(campaign_id));

drop policy if exists campaign_updates_rw_owner on public.campaign_updates;
create policy campaign_updates_rw_owner on public.campaign_updates
  for all to authenticated
  using (private.owns_campaign(auth.uid(), campaign_id))
  with check (private.owns_campaign(auth.uid(), campaign_id));

drop policy if exists campaign_updates_select_staff on public.campaign_updates;
create policy campaign_updates_select_staff on public.campaign_updates
  for select to authenticated using (private.is_staff(auth.uid()));

-- ---------------- campaign_slug_redirects (leitura pública) ----------------
grant select on public.campaign_slug_redirects to anon, authenticated;
drop policy if exists slug_redirects_select_all on public.campaign_slug_redirects;
create policy slug_redirects_select_all on public.campaign_slug_redirects
  for select using (true);

-- ---------------- reports ----------------
grant select, insert on public.reports to authenticated;

drop policy if exists reports_insert_authenticated on public.reports;
create policy reports_insert_authenticated on public.reports
  for insert to authenticated
  with check (reporter_user_id = auth.uid());

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select to authenticated
  using (reporter_user_id = auth.uid());

drop policy if exists reports_select_staff on public.reports;
create policy reports_select_staff on public.reports
  for select to authenticated
  using (private.is_staff(auth.uid()));

-- ---------------- campaign_moderation_events ----------------
grant select on public.campaign_moderation_events to authenticated;
drop policy if exists moderation_events_select_staff on public.campaign_moderation_events;
create policy moderation_events_select_staff on public.campaign_moderation_events
  for select to authenticated
  using (private.is_staff(auth.uid()));

drop policy if exists moderation_events_select_owner on public.campaign_moderation_events;
create policy moderation_events_select_owner on public.campaign_moderation_events
  for select to authenticated
  using (private.owns_campaign(auth.uid(), campaign_id));
