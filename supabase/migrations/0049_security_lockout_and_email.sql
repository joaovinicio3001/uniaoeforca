-- Item 14: trava de login por tentativas malsucedidas (persistente, sobrevive a
-- reinício de instância — ao contrário do rate limit em memória).
create table if not exists public.login_attempts (
  identifier    text primary key,        -- e-mail em minúsculas
  fail_count    int not null default 0,
  first_fail_at timestamptz not null default now(),
  last_fail_at  timestamptz not null default now(),
  locked_until  timestamptz
);

alter table public.login_attempts enable row level security;
comment on table public.login_attempts is
  'Contagem de falhas de login por e-mail para trava temporária. Acesso só via service_role.';

-- Item 12: marca quando a notificação já teve o e-mail transacional enviado,
-- para o job de flush não reenviar.
alter table public.notifications
  add column if not exists emailed_at timestamptz;
