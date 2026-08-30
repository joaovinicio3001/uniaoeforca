-- Fase 0 — provisionamento automático ao criar usuário no Supabase Auth.
-- Cria o profile a partir do metadata do cadastro e concede os papéis padrão
-- (doador + criador — doc §3: "Usuário / Criador").

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    id,
    full_name,
    display_name,
    cpf_hash,
    cpf_last3,
    birth_date,
    phone,
    marketing_opt_in,
    terms_accepted_at,
    status
  )
  values (
    new.id,
    coalesce(nullif(meta->>'full_name', ''), 'Novo usuário'),
    nullif(meta->>'display_name', ''),
    nullif(meta->>'cpf_hash', ''),
    nullif(meta->>'cpf_last3', ''),
    (nullif(meta->>'birth_date', ''))::date,
    nullif(meta->>'phone', ''),
    coalesce((meta->>'marketing_opt_in')::boolean, false),
    case when coalesce((meta->>'terms_accepted')::boolean, false)
         then now() else null end,
    'active'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'doador'), (new.id, 'criador')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Cria profile + papéis padrão ao inserir em auth.users (doc §3, §6.1).';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
