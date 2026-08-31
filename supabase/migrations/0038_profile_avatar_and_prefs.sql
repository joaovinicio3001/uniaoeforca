-- Perfil (aba "Meu perfil" do painel).
-- Adiciona foto de avatar e a preferência de e-mails sobre as campanhas do
-- próprio usuário. "Atualizações da plataforma" reaproveita
-- profiles.marketing_opt_in (já existente).

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists notify_campaign_activity boolean not null default true;

comment on column public.profiles.avatar_url is
  'URL pública da foto de perfil (storage/CDN). Nullable = usa iniciais.';
comment on column public.profiles.notify_campaign_activity is
  'Preferência: receber e-mails com novidades das campanhas do próprio usuário.';
