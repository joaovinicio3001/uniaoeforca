-- Fase 0 — extensões base.
-- pgcrypto: gen_random_uuid(), digest() para hash de CPF.
-- citext: comparação case-insensitive (uso futuro em slugs/handles).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

-- Função utilitária: atualiza updated_at em UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: mantém updated_at sincronizado.';
