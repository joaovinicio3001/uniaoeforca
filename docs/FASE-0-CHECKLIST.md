# Fase 0 — Checklist de aceite

Critério de saída da doc (§27): **"Login/cadastro e deploy funcionando."**

## Fundação
- [x] Projeto Next.js 15 (App Router, TS, Tailwind, shadcn/ui) com `output: standalone`
- [x] Projeto Supabase provisionado — `uniao-e-forca` / `qmpsranxguyxxbplvcjf` (sa-east-1)
- [x] `.env.example` completo (§34.8) + `.env.local` com URL + anon key
- [x] Validação de ambiente com Zod (`lib/env.ts`), segredos isolados do client

## Banco + migrations
- [x] 7 migrations versionadas em `supabase/migrations/`, todas aplicadas ao remoto
- [x] `profiles`, `user_roles` (+ enum `app_role`), `audit_logs`, `notifications`
- [x] Trigger `handle_new_user` cria profile + papéis padrão
- [x] RLS habilitada e testada em todas as tabelas (deny-by-default)
- [x] Advisor de segurança do Supabase sem alertas
- [x] `lib/database.types.ts` gerado

## Autenticação
- [x] Cadastro com validação forte (nome, CPF com DV, +18, e-mail, WhatsApp, senha, termos)
- [x] Login com mensagens genéricas (não vaza existência de conta)
- [x] Recuperação de senha (resposta idêntica exista ou não a conta)
- [x] Alteração de senha autenticada (`/painel/seguranca`)
- [x] Callback de e-mail (`/auth/confirm`) — `verifyOtp` + PKCE
- [x] Logout com auditoria
- [x] Rate limit em login / cadastro / recuperação

## RBAC + guardas
- [x] Matriz papel→permissão pura e testada (`lib/auth/rbac.ts`)
- [x] Middleware protege `/painel/*` (auth) e `/admin/*` (staff)
- [x] Revalidação server-side nos layouts `(dashboard)` e `admin` (não confia só no middleware)

## UI base
- [x] Paleta oficial (#06356B / #05B76B / #FDBD22 / #F6F8FA) em tokens claro/escuro
- [x] Primitivos: button, input, label, card, alert, sonner
- [x] Layout público (header/footer) + shell de painel/admin (topbar + sidebar)
- [x] Home, 404, wordmark original (sem assets de terceiros — §32)

## Observabilidade / operação
- [x] `/api/health` (processo + conectividade com o banco)
- [x] Trilha de auditoria imutável para eventos de auth
- [x] Headers de segurança em `next.config.mjs`

## Qualidade / CI / container
- [x] Vitest: rbac, cpf, validação de auth, rate-limit
- [x] `npm run lint` / `typecheck` / `test` / `build`
- [x] GitHub Actions rodando os 4 no push/PR
- [x] Dockerfile multi-stage + `docker-compose.yml` + `.dockerignore`

## Verificação executada nesta entrega
- [x] `npm install` sem erros (Next bumpado p/ 15.5.x — CVE-2025-66478; `@supabase/ssr` p/ 0.12.x — compat. supabase-js 2.112)
- [x] `npm run build` — 12 rotas compiladas
- [x] `npm run lint` / `typecheck` / `test` (21 testes) — verdes
- [x] `npm run dev` — `/`, `/login`, `/cadastro`, `/recuperar-senha` → 200; `/painel`, `/admin` → 307 p/ login
- [x] `/api/health` → `{"database":"ok"}` (RPC `health_check` round-trip)
- [x] Trigger `handle_new_user`: signup real criou profile + papéis `[criador, doador]`; delete em `auth.users` fez cascade
- [x] RLS: anon `SELECT profiles` → `42501`; RPC `is_staff` → 404 (não exposto); RPC `health_check` → 200

## Verificação manual ainda pendente (precisa de você)
- [ ] Fluxo end-to-end no navegador: cadastrar → confirmar e-mail → login → `/painel` → logout
- [ ] Promover seu usuário a `admin` via SQL e acessar `/admin`
- [ ] Preencher `SUPABASE_SERVICE_ROLE_KEY` → contadores + auditoria no `/admin`

## Fora do escopo da Fase 0 (fases seguintes / jurídico)
- MFA/TOTP no admin, reautenticação para ações sensíveis
- WAF / rate-limit no Cloudflare
- Cifra de CPF via Vault (Fase 5)
- Pentest, Termos de Uso, validação regulatória (§30, §33)
