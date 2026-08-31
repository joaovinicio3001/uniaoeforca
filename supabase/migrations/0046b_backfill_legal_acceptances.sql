-- Backfill: usuários existentes já haviam aceitado os termos vigentes ao se
-- cadastrar. Registra o aceite da versão atual para não disparar o aviso de
-- reconsentimento indevidamente no primeiro acesso após o deploy.
insert into public.legal_acceptances (user_id, document, version, accepted_at)
select p.id, d.document, v.version, coalesce(p.terms_accepted_at, p.created_at)
from public.profiles p
cross join (values ('terms'), ('privacy'), ('campaign_policy')) as d(document)
cross join (values ('2026-08-31')) as v(version)
on conflict (user_id, document, version) do nothing;
