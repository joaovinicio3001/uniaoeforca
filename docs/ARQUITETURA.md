# Decisões de arquitetura — Fase 0

Registro curto no estilo ADR. Contexto: doc mestra §17 vs §34.

## ADR-001 — Aplicação única Next.js (não monorepo NestJS)

A §17 propõe monorepo `apps/web + apps/api (NestJS) + apps/admin`. A §34
("Infraestrutura oficial") define **Next.js + Supabase** como stack oficial.
Escolhemos a §34: uma app Next.js com Route Handlers / Server Actions como
camada BFF/back-end. `admin` é um grupo de rotas (`/admin/*`), não um app
separado. Menos superfície operacional; troca de provedores fica isolada em
adapters (ADR-006).

## ADR-002 — Fonte de verdade de identidade: `auth.users` do Supabase

O e-mail e o estado de verificação vivem em `auth.users`. `public.profiles`
(1:1 com `auth.users.id`) guarda os demais campos do cadastro (§6.1). Evita
divergência entre duas "tabelas de usuário". `profiles` e os papéis padrão são
criados pelo trigger `handle_new_user` a partir do `raw_user_meta_data` enviado
no `signUp`.

## ADR-003 — RBAC em tabela `user_roles` (N papéis por usuário)

Enum `app_role` = `doador | criador | criador | analista | financeiro | admin |
superadmin` (§3). "visitante" é implícito (não autenticado) e nunca é gravado.
Todo cadastro recebe `doador` + `criador`. A matriz papel→permissão vive em
`lib/auth/rbac.ts` (módulo **puro**, testável, reutilizado em middleware, RSC,
route handlers e client). Autorização fina por `can(roles, permission)`.

`ledger:post_manual` existe na enum de permissões mas **nenhum papel a possui**
— reflete a regra "proibido ajustar saldo manualmente sem lançamento" (§12).

## ADR-004 — RLS deny-by-default + escrita sensível fora da API do cliente

Todas as tabelas expostas têm RLS ligada (§34.7). Só há policy para o que o
cliente pode legitimamente fazer:

| Tabela | SELECT | UPDATE | INSERT/DELETE |
|---|---|---|---|
| `profiles` | dono + staff | dono | — (trigger / cascade) |
| `user_roles` | dono + staff | — | — (só `service_role`) |
| `audit_logs` | staff | — | — (append-only via `service_role`) |
| `notifications` | dono | dono (marcar lido) | — (insert server-side) |

`anon` teve os grants revogados nessas tabelas (defesa em profundidade).
Alteração de papéis e escrita de auditoria passam por `lib/supabase/admin.ts`
(cliente `service_role`, marcado `server-only`).

## ADR-005 — Helpers de autorização em schema `private`

`is_staff`, `is_superadmin`, `has_role` são `SECURITY DEFINER` (necessário para
serem usados dentro das policies sem recursão em `user_roles`). Ficam no schema
`private`, que o PostgREST **não expõe** — assim não viram endpoints
`/rest/v1/rpc/*`. Isso zera os alertas `0028/0029` do linter do Supabase.
`set search_path = ''` em todas as funções (alerta `0011`).

## ADR-006 — Provedores externos atrás de adapters

O domínio financeiro nunca importa Pushin Pay / GGPix / Bunny diretamente
(§34.9). Interfaces `PixInProvider`, `PixOutProvider`, storage — implementadas
nas fases 1/2/4. Nenhum percentual/segredo de provedor no código: taxas vão para
`fee_rules` versionadas (§9) e credenciais para env/secret manager.

## ADR-007 — Dinheiro em centavos inteiros

Nunca `float` (§24). Colunas monetárias serão `bigint` (centavos). `formatBRL()`
é só apresentação. Já é convenção antes de existir qualquer coluna de valor.

## ADR-008 — CPF nunca em claro

`profiles.cpf_hash` (SHA-256 + pepper) para dedup e `cpf_last3` para suporte.
`cpf_encrypted bytea` reservado para a Fase 5 (KYC) com chave do Supabase Vault.
Limitação conhecida: espaço de CPF é pequeno; hash+pepper não resiste a
brute-force de quem tiver os dois. Mitigação real = tokenização do PSP na Fase 5.

## ADR-009 — Rate limiting em memória (temporário)

`lib/security/rate-limit.ts` usa janela fixa em memória: suficiente para dev e
1 instância. Produção multi-instância → Redis/Upstash ou rate limit do
Cloudflare (§34.1). Interface já isola a troca.

## Pendências herdadas para as próximas fases

- MFA/TOTP obrigatório no admin e reautenticação para ações sensíveis (§6.2).
- Realtime do Supabase para UI — **nunca** como fonte de verdade financeira (§34.1).
- Sentry real + logs estruturados com redação de PII (§15).
- `sitemap.xml` e OpenGraph por campanha (§24) — dependem da Fase 1.
