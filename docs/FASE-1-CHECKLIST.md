# Fase 1 — Campanhas · Checklist de aceite

Critério de saída da doc (§27): **"Campanha completa navegável."**

## Banco + migrations
- [x] `0008`–`0012` aplicadas ao remoto `qmpsranxguyxxbplvcjf`
- [x] `categories` com 8 categorias (doc §7.1)
- [x] `campaigns` + `campaign_media` + `campaign_updates` + `campaign_slug_redirects` + `reports` + `campaign_moderation_events`
- [x] Busca full-text PT-BR (`search_tsv` gerada + índice GIN)
- [x] RLS deny-by-default nas 7 tabelas; `anon` sem grants de escrita
- [x] Bucket `campaign-media` público (fallback dev)
- [x] Advisor de **segurança**: sem alertas. Advisor de performance: só INFO/WARN (initplan corrigido em `0012`)
- [x] `lib/database.types.ts` regenerado

## Máquina de estados (doc §7.2)
- [x] Grafo `draft → pending_review → active ⇄ paused → completed → archived`, `↘ rejected`, `active/paused → blocked`
- [x] `owner` vs `staff` — só staff aprova/reprova/bloqueia
- [x] Toda transição via `transitionCampaign()` (service_role): valida grafo + `moderation_events` + `audit_logs` + `notifications`
- [x] `campaigns_update_owner` (RLS) só permite edição em `draft`/`rejected`

## Criador (doc §4.1, §21.2)
- [x] `/painel/campanhas` — lista com status e progresso
- [x] `/painel/campanhas/nova` — cria rascunho (slug único gerado do título)
- [x] `/painel/campanhas/[id]` — editar (draft/rejected), enviar p/ análise, pausar/retomar/encerrar/arquivar
- [x] Upload de imagens: valida MIME real (magic bytes) + tamanho ≤ 5 MB, nome aleatório, 1ª vira capa, trocar capa, excluir
- [x] Publicar atualização (sanitizada)
- [x] Histórico de moderação visível ao dono; motivo de reprovação/bloqueio exibido

## Moderação (doc §7.3)
- [x] `/admin/campanhas` — filas (análise / ativas / bloqueadas / todas) + contador de denúncias
- [x] `/admin/campanhas/[id]` — aprovar / reprovar (motivo obrigatório) / bloquear / reativar
- [x] Denúncias: resolver (procede / descartar) com nota + auditoria

## Público (doc §5, §24)
- [x] `/campanhas` — grid, busca full-text, filtro por categoria, ordenação, paginação
- [x] `/campanhas/[slug]` — capa + galeria, progresso, história sanitizada, aba de atualizações, compartilhar, denunciar (exige login)
- [x] Redirect de slug antigo (`campaign_slug_redirects` → 307)
- [x] Rascunho/bloqueada → 404 para o público
- [x] `/campanhas/[slug]/contribuir` — stub "Fase 2"
- [x] `/buscar?q=` → `/campanhas?q=`
- [x] SEO: `generateMetadata` + OpenGraph por campanha; `sitemap.xml` dinâmico; `robots.txt`

## Segurança / sanitização (doc §7.1, §15)
- [x] `story`/atualizações sanitizadas (allowlist estreita, links forçados a `target=_blank rel=noopener nofollow ugc`, sem script/iframe/on*/javascript:)
- [x] Texto puro → parágrafos HTML preservando quebras
- [x] Provedores de storage desacoplados (`StorageProvider` + Supabase/Bunny — §34.9)
- [x] Rate limit em criar campanha e denunciar

## Qualidade
- [x] `tsc --noEmit` · `next lint` · `next build` (21 rotas) — verdes
- [x] Vitest: **38 testes** (17 novos: slug, state-machine, sanitize, meta→centavos)
- [x] E2E verificado: criar campanha (SQL) → anon lista só a ativa, não o rascunho → página pública renderiza história/atualização/valor → redirect de slug → 404 de rascunho → sitemap

## Fora do escopo desta fase
- Doações / PIX In (Fase 2) — botão "Quero ajudar" leva ao stub
- `raised_amount_cents` / `supporters_count` são projeções; passam a ser mantidos pelo ledger na Fase 3
- Editor rich-text visual (a entrada é textarea com formatação básica preservada)
- Bunny.net real (usa Supabase Storage até as credenciais existirem)
- Redimensionamento/variantes WebP no upload (doc §34.6) — Fase de hardening
