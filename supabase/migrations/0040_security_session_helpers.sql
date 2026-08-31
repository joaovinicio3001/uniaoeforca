-- Helpers para a aba Segurança lerem/revogarem sessões do próprio usuário.
-- Só o service_role executa (server actions). Sempre filtram por user_id.

create or replace function public.sec_list_user_sessions(p_user_id uuid)
returns table (
  session_id uuid,
  created_at timestamptz,
  refreshed_at timestamp,
  not_after timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select s.id, s.created_at, s.refreshed_at, s.not_after
  from auth.sessions s
  where s.user_id = p_user_id
$$;

revoke all on function public.sec_list_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.sec_list_user_sessions(uuid) to service_role;

create or replace function public.sec_revoke_user_session(p_user_id uuid, p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  delete from auth.sessions where id = p_session_id and user_id = p_user_id;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.sec_revoke_user_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.sec_revoke_user_session(uuid, uuid) to service_role;
