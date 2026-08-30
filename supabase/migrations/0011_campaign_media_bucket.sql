-- Fase 1 — bucket de Storage para mídia de campanha (fallback de dev; em
-- produção a mídia pública vai para o Bunny.net — doc §34.6).
-- Bucket público para leitura; escrita só via server-side (service_role) após
-- validação de MIME/dimensões/quantidade.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-media',
  'campaign-media',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública dos objetos do bucket.
drop policy if exists "campaign_media_public_read" on storage.objects;
create policy "campaign_media_public_read" on storage.objects
  for select using (bucket_id = 'campaign-media');

-- Sem policies de INSERT/UPDATE/DELETE: uploads e remoções passam pelo
-- service_role nas server actions (lib/storage).
