-- Fase 1 — ajustes de performance apontados pelo linter do Supabase.
--   * auth_rls_initplan: trocar auth.uid() por (select auth.uid()) nas policies
--     para o Postgres avaliar a função uma vez por query, não por linha.
--   * unindexed_foreign_keys: índices de cobertura para FKs usadas em joins/filtros.
-- (Os avisos "unused_index" e "multiple_permissive_policies" são aceitáveis
--  nesta fase: índices ainda sem tráfego e policies separadas por clareza.)

-- ---------- índices de cobertura para FKs ----------
create index if not exists idx_campaign_moderation_events_actor
  on public.campaign_moderation_events (actor_user_id);
create index if not exists idx_campaign_slug_redirects_campaign
  on public.campaign_slug_redirects (campaign_id);
create index if not exists idx_campaign_updates_author
  on public.campaign_updates (author_user_id);
create index if not exists idx_campaigns_cover_media
  on public.campaigns (cover_media_id);
create index if not exists idx_reports_reporter
  on public.reports (reporter_user_id);
create index if not exists idx_reports_resolved_by
  on public.reports (resolved_by);
create index if not exists idx_user_roles_granted_by
  on public.user_roles (granted_by);

-- ---------- Fase 0: profiles / user_roles / audit_logs / notifications ----------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_select_staff on public.profiles;
create policy profiles_select_staff on public.profiles
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists user_roles_select_staff on public.user_roles;
create policy user_roles_select_staff on public.user_roles
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists audit_logs_select_staff on public.audit_logs;
create policy audit_logs_select_staff on public.audit_logs
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- Fase 1 ----------
drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories
  for select using (active or private.is_staff((select auth.uid())));

drop policy if exists campaigns_select_owner on public.campaigns;
create policy campaigns_select_owner on public.campaigns
  for select to authenticated using (owner_user_id = (select auth.uid()));

drop policy if exists campaigns_select_staff on public.campaigns;
create policy campaigns_select_staff on public.campaigns
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists campaigns_insert_owner on public.campaigns;
create policy campaigns_insert_owner on public.campaigns
  for insert to authenticated
  with check (owner_user_id = (select auth.uid()) and status = 'draft');

drop policy if exists campaigns_update_owner on public.campaigns;
create policy campaigns_update_owner on public.campaigns
  for update to authenticated
  using (owner_user_id = (select auth.uid()) and status in ('draft', 'rejected'))
  with check (owner_user_id = (select auth.uid()) and status in ('draft', 'rejected'));

drop policy if exists campaign_media_rw_owner on public.campaign_media;
create policy campaign_media_rw_owner on public.campaign_media
  for all to authenticated
  using (private.owns_campaign((select auth.uid()), campaign_id))
  with check (private.owns_campaign((select auth.uid()), campaign_id));

drop policy if exists campaign_media_select_staff on public.campaign_media;
create policy campaign_media_select_staff on public.campaign_media
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists campaign_updates_rw_owner on public.campaign_updates;
create policy campaign_updates_rw_owner on public.campaign_updates
  for all to authenticated
  using (private.owns_campaign((select auth.uid()), campaign_id))
  with check (private.owns_campaign((select auth.uid()), campaign_id));

drop policy if exists campaign_updates_select_staff on public.campaign_updates;
create policy campaign_updates_select_staff on public.campaign_updates
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists reports_insert_authenticated on public.reports;
create policy reports_insert_authenticated on public.reports
  for insert to authenticated
  with check (reporter_user_id = (select auth.uid()));

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select to authenticated using (reporter_user_id = (select auth.uid()));

drop policy if exists reports_select_staff on public.reports;
create policy reports_select_staff on public.reports
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists moderation_events_select_staff on public.campaign_moderation_events;
create policy moderation_events_select_staff on public.campaign_moderation_events
  for select to authenticated using (private.is_staff((select auth.uid())));

drop policy if exists moderation_events_select_owner on public.campaign_moderation_events;
create policy moderation_events_select_owner on public.campaign_moderation_events
  for select to authenticated
  using (private.owns_campaign((select auth.uid()), campaign_id));
