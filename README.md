# União & Força

Plataforma brasileira de crowdfunding. Usuários criam campanhas, recebem doações
por **PIX**, acompanham a arrecadação num **ledger auditável** e solicitam
**saque via PIX Out** após análise administrativa.

> Base: `Uniao_e_Forca_Documentacao_Mestra_v2.docx`. Este repositório segue a
> **infraestrutura oficial (§34)**: Next.js + Supabase + Bunny.net + Pushin Pay
> (PIX In) + GGPix (PIX Out).

**Estado atual: Fases 0–7 implementadas.** Auth/RBAC · campanhas + moderação ·
PIX In (Pushin Pay) · ledger de dupla entrada · saques + PIX Out (GGPix) ·
KYC/risco · conciliação · hardening/LGPD. Ver `docs/PLANO-DE-MIGRATIONS.md` e os
`docs/FASE-*-CHECKLIST.md`. Deploy: `docs/DEPLOY.md`. Operação: `docs/RUNBOOK.md`.
Antes de produção: `docs/GO-LIVE.md`.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend + BFF | Next.js 15 (App Router, RSC, Route Handlers), TypeScript |
| UI | Tailwind CSS + componentes shadcn/ui (New York) |
| Banco / Auth | Supabase (PostgreSQL 17, Auth, RLS) |
| Validação | Zod |
| Testes | Vitest |
| Observabilidade | Sentry (placeholder) + logs estruturados |
| CI | GitHub Actions (lint · typecheck · test · build) |
| Container | Dockerfile multi-stage (`output: standalone`) |

Provedores desacoplados do domínio via adapters (§34.9) — entram nas fases 1/2/4:
Bunny.net (imagens), Pushin Pay (PIX In), GGPix (PIX Out).

---

## Pré-requisitos

- Node.js ≥ 20.11
- Conta/projeto Supabase — já provisionado: **`uniao-e-forca`** (`qmpsranxguyxxbplvcjf`, região `sa-east-1`)

## Setup

```bash
npm install
cp .env.example .env.local   # já existe um .env.local preenchido com a URL + anon key
```

Preencha em `.env.local`:

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Project Settings → API → `service_role`.
  Necessária para auditoria, contadores do admin e (futuramente) jobs financeiros.
- `CPF_HASH_PEPPER` — qualquer segredo forte (16+ chars) para dev; **obrigatório e único** em produção.

```bash
npm run dev       # http://localhost:3000
```

## Scripts

| Comando | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e execução de produção |
| `npm run lint` | ESLint (`next lint`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unitários) |
| `npm run db:types` | Instruções para regerar `lib/database.types.ts` |

## Banco de dados (migrations)

As migrations ficam em `supabase/migrations/` e **já foram aplicadas** ao projeto
remoto `qmpsranxguyxxbplvcjf` (via MCP do Supabase). Para reaplicar em outro
ambiente:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Fase 0 cria: `profiles`, `user_roles` (+ enum `app_role`), `audit_logs`,
`notifications`, trigger `handle_new_user`, helpers de RBAC em `private.*` e
**RLS deny-by-default** em todas as tabelas. Detalhes em `docs/ARQUITETURA.md`.

### Virar admin

Cadastre-se normalmente e rode no SQL Editor do Supabase (ver `supabase/seed.sql`):

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users where email = 'voce@exemplo.com'
on conflict do nothing;
```

## Estrutura

```
app/
  (public)/      # site público (home + placeholders institucionais)
  (auth)/        # login, cadastro, recuperar-senha + server actions
  (dashboard)/   # /painel/* — exige autenticação
  admin/         # /admin/*  — exige papel de staff
  api/health/    # health check
  auth/confirm/  # callback dos links de e-mail (verifyOtp / PKCE)
lib/
  supabase/      # clients browser / server / admin (service_role) / middleware
  auth/          # rbac (puro) + session helpers (server-only)
  security/      # audit, rate-limit, crypto (hash de CPF)
  validation/    # schemas Zod + validação de CPF
components/
  ui/            # primitivos shadcn
  forms/ layout/ brand/
supabase/migrations/   # DDL versionado
__tests__/             # Vitest
docs/                  # arquitetura, plano de migrations, checklist
```

## Segurança (Fase 0)

- RLS habilitada em todas as tabelas expostas; `anon` sem grants nessas tabelas.
- `service_role` só no servidor (`lib/supabase/admin.ts` + `import "server-only"`).
- Hash de senha e sessão pelo Supabase Auth; rate limit em login/cadastro/recuperação.
- Trilha de auditoria imutável (`audit_logs`, append-only) para eventos de auth.
- Headers de segurança básicos em `next.config.mjs`.
- Advisor de segurança do Supabase: **sem alertas** após `0006`.

Itens ainda **pendentes** (fases seguintes): MFA/TOTP no admin, reautenticação
para ações sensíveis, WAF/rate-limit no Cloudflare, cifra de CPF via Vault,
pentest (§15, §33).

## Aviso

Especificação de produto e engenharia — **não** é validação jurídica. Modelo de
recebimento de terceiros e repasse, KYC/PLD-FT, tributação, LGPD e contratos com
provedores precisam de revisão especializada antes de qualquer operação real
(§1, §30).
