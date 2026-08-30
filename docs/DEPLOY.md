# Deploy — Vercel + GitHub + Supabase

## Visão geral

- **App**: Next.js na Vercel (build padrão; `vercel.json` só define os crons).
- **Banco/Auth/Storage**: Supabase (projeto `uniao-e-forca` / `qmpsranxguyxxbplvcjf`, região `sa-east-1`).
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) roda lint · typecheck · test · build em cada push/PR.
- **CD**: Vercel conectada ao repositório GitHub — deploy automático no `main` (produção) e Preview nos PRs.

## 1. GitHub

```bash
git remote add origin git@github.com:<voce>/uniao-e-forca.git
git push -u origin main
```

O repositório já tem `.gitignore` cobrindo `.env*`, `.next/`, `node_modules/`.
**Nunca comite `.env.local`.**

## 2. Vercel

1. **New Project → Import** do repositório GitHub.
2. Framework: Next.js (autodetectado). Root: raiz do repo. Build/Output: padrão.
3. Adicione as variáveis de ambiente (seção 4) em **Production** e, o que fizer sentido, em **Preview**.
4. Deploy. Os crons de `vercel.json` são registrados automaticamente:
   - `GET /api/cron/reconcile` — diário 06:00 UTC
   - `GET /api/cron/daily-ops` — de hora em hora
   A Vercel envia `Authorization: Bearer $CRON_SECRET` — por isso `CRON_SECRET` **precisa** estar setado.
5. Configure o domínio `uniaoeforca.com.br` (Cloudflare como DNS/WAF — doc §34.1) e ajuste `NEXT_PUBLIC_SITE_URL`.

## 3. Supabase (produção)

- **Authentication → Sign In / Providers → Email**: mínimo de senha ≥ 8, requisitos de caractere, "Prevent use of leaked passwords" (Pro).
- **Authentication → URL Configuration**: Site URL e Redirect URLs = `https://uniaoeforca.com.br` e `https://uniaoeforca.com.br/auth/confirm`.
- **Authentication → Email**: SMTP próprio (Resend/SES) para não usar o SMTP de dev do Supabase.
- **Migrations**: já aplicadas ao remoto via MCP. Para outro ambiente: `npx supabase link --project-ref <ref> && npx supabase db push`.
- **Storage**: buckets `campaign-media` (público) e `kyc-docs` (privado) já criados pelas migrations.
- **Backups**: habilitar PITR no plano pago; testar restauração (doc §33).
- **service_role key**: só na Vercel (Production env), nunca no client nem no repo.

## 4. Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Obrigatória | Observação |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | sim | `https://uniaoeforca.com.br` |
| `NEXT_PUBLIC_SUPABASE_URL` | sim | `https://qmpsranxguyxxbplvcjf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | chave publicável (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | secret; Dashboard → Project Settings → API |
| `CPF_HASH_PEPPER` | sim (prod) | segredo forte, estável (16+ chars) |
| `SECRETS_ENC_KEY` | sim (prod) | 64 hex (AES-256) para cifrar chaves PIX — estável |
| `CRON_SECRET` | sim | habilita os jobs agendados |
| `PUSHINPAY_API_KEY` | sim | PIX In |
| `PUSHINPAY_WEBHOOK_SECRET` | sim | token no path do webhook |
| `PUSHINPAY_BASE_URL` | recomendado | `https://api.pushinpay.com.br/api` (token de produção) |
| `GGPIX_API_KEY` | sim | PIX Out |
| `GGPIX_WEBHOOK_SECRET` | sim | gerar no painel GGPix |
| `FIXIE_URL` | sim (PIX Out real) | proxy de IP estático whitelistado na GGPix |
| `PIXOUT_PROVIDER` | opcional | `auto` (default) / `mock` / `ggpix` |
| `BUNNY_STORAGE_ZONE` / `BUNNY_STORAGE_API_KEY` / `BUNNY_CDN_URL` | recomendado | CDN de imagens; sem isso usa Supabase Storage |
| `RESEND_API_KEY` / `EMAIL_FROM` | recomendado | e-mail transacional; sem isso é no-op |
| `SENTRY_DSN` | opcional | reporte de erros (sem SDK) |
| `PUSHINPAY_FEE_BPS` / `PUSHINPAY_FEE_MIN_CENTS` | opcional | estimativa do custo do PIX In (default 300 / 77) |
| `WITHDRAWAL_MIN_CENTS` / `WITHDRAWAL_MAX_CENTS` / `WITHDRAWAL_DAILY_MAX_CENTS` | opcional | limites de saque |
| `WITHDRAWAL_PIX_KEY_COOLDOWN_HOURS` | opcional | default 24 |
| `KYC_ENHANCED_THRESHOLD_CENTS` | opcional | default 200000 (R$ 2.000) |
| `WITHDRAWAL_HIGH_VALUE_CENTS` | opcional | default 500000 (R$ 5.000) — dupla aprovação |

`.env.example` no repo lista tudo com comentários.

## 5. Webhooks nos provedores (após deploy)

- **Pushin Pay**: a URL de webhook é enviada por cobrança pelo backend —
  `https://uniaoeforca.com.br/api/webhooks/pushinpay/<PUSHINPAY_WEBHOOK_SECRET>`. Nada a configurar no painel além da API key.
- **GGPix**: registrar o webhook `https://uniaoeforca.com.br/api/webhooks/ggpix/<GGPIX_WEBHOOK_SECRET>` no painel, e **whitelistar os 2 IPs do Fixie** em "IPs Permitidos".

## 6. Pós-deploy — verificação

1. `GET /api/health` → `{"status":"healthy"}`.
2. Cadastro → confirmar e-mail → login → `/painel`.
3. Promover-se a admin (SQL em `supabase/seed.sql`) e abrir `/admin`.
4. Criar campanha → aprovar no admin → doar (PIX real, R$ 5, não pagar) → ver QR.
5. `GET /api/cron/reconcile` com header `Authorization: Bearer $CRON_SECRET` → 200.
