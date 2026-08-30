-- Fase 2 — remove get_campaign_supporters(): o linter (0028/0029) sinaliza
-- funções SECURITY DEFINER expostas via RPC. A lista pública de apoiadores passa
-- a ser lida server-side com service_role, selecionando só colunas seguras
-- (ver lib/campaigns/queries.ts::getCampaignSupporters).

drop function if exists public.get_campaign_supporters(uuid, int);
