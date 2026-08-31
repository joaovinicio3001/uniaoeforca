-- Contador de visualizações da página pública da campanha (métrica para o
-- criador — doc §7). Incremento best-effort via RPC pública.
alter table public.campaigns
  add column if not exists view_count bigint not null default 0;

create or replace function public.increment_campaign_view(p_slug text)
returns void
language sql
security definer
set search_path to ''
as $function$
  update public.campaigns
  set view_count = view_count + 1
  where slug = p_slug and status in ('active', 'completed');
$function$;

grant execute on function public.increment_campaign_view(text) to anon, authenticated;
