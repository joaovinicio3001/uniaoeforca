-- Configurações operacionais editáveis pelo admin (doc §13). Chave/valor JSONB.
-- Nada aqui é secret: são parâmetros de negócio (mín. de saque, prazos, textos,
-- modo manutenção). Leitura/escrita só via service_role (sem policy = RLS nega).
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.app_settings enable row level security;

comment on table public.app_settings is
  'Parâmetros operacionais editáveis pelo admin. Acesso apenas via service_role.';

insert into public.app_settings (key, value, description) values
  ('withdrawal_min_cents', '2000'::jsonb,
   'Valor mínimo de um saque, em centavos.'),
  ('withdrawal_pix_key_cooldown_hours', '24'::jsonb,
   'Período de segurança (horas) entre cadastrar a chave PIX e poder sacar para ela.'),
  ('withdrawal_daily_max_cents', '200000000'::jsonb,
   'Teto de saque por usuário por dia, em centavos.'),
  ('release_delay_hours', '0'::jsonb,
   'Atraso (horas) entre a doação confirmar e o valor ficar disponível para saque.'),
  ('maintenance_mode', 'false'::jsonb,
   'Quando true, exibe aviso de manutenção no site.'),
  ('maintenance_message',
   '"Estamos em manutenção. Voltamos em instantes."'::jsonb,
   'Texto exibido quando o modo manutenção está ativo.'),
  ('support_email', '"suporte@uniaoeforca.com.br"'::jsonb,
   'E-mail de suporte exibido ao público.')
on conflict (key) do nothing;
