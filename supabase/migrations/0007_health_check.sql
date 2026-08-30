-- Fase 0 — função trivial para o health check fazer um round-trip real ao banco
-- sem depender de RLS/permissão de tabela. Não expõe dado algum.

create or replace function public.health_check()
returns text
language sql
stable
set search_path = ''
as $$ select 'ok'::text $$;

revoke all on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated;
