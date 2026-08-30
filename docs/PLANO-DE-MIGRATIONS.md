# Plano de migrations por fase

Mapeia o roadmap (§27) e as tabelas do modelo de dados (§18) para migrations
incrementais. Cada fase só avança com testes verdes (regra do prompt mestre §32).

## Fase 0 — Fundação ✅ (aplicada)

| Migration | Conteúdo |
|---|---|
| `0000_extensions` | `pgcrypto`, `citext`, `set_updated_at()` |
| `0001_core_identity` | enum `app_role`; `profiles`; `user_roles`; helpers RBAC |
| `0002_audit_notifications` | `audit_logs` (append-only); `notifications` |
| `0003_auth_hooks` | `handle_new_user()` + trigger em `auth.users` |
| `0004_rls_policies` | RLS deny-by-default nas 4 tabelas |
| `0005_security_hardening` | `search_path` fixo; revogações de EXECUTE |
| `0006_private_rbac_helpers` | helpers movidos para schema `private` |

**Critério de saída:** login/cadastro e deploy funcionando. ✔

## Fase 1 — Campanhas ✅ (aplicada)

| Migration | Conteúdo |
|---|---|
| `0008_campaign_enums_categories` | enums `campaign_status/visibility`, `report_status/reason`; `categories` + seed (8) |
| `0009_campaigns` | `campaigns` (+ `search_tsv` GIN), `campaign_media`, `campaign_updates`, `campaign_slug_redirects`, `reports`, `campaign_moderation_events`; helpers `private.owns_campaign`, `private.campaign_is_public` |
| `0010_campaigns_rls` | RLS deny-by-default nas 7 tabelas: rascunho só do dono; `active/completed` público; staff lê tudo |
| `0011_campaign_media_bucket` | bucket público `campaign-media` (fallback dev; Bunny em produção) |
| `0012_rls_perf` | `(select auth.uid())` em todas as policies (Fase 0+1); índices de cobertura para FKs |

Máquina de estados (§7.2) em `lib/campaigns/state-machine.ts` (pura, testada).
Mudança de status só via `transitionCampaign()` (service_role) — valida o grafo,
grava `campaign_moderation_events` + `audit_logs` + `notifications`.

**Saída:** campanha completa navegável ✔ (criar → imagens → análise → aprovar →
página pública com história/atualizações/denúncia; busca full-text PT-BR; SEO +
OpenGraph + sitemap; redirect de slug antigo).

## Fase 2 — PIX In ✅ (aplicada)

| Migration | Conteúdo |
|---|---|
| `0013_payment_enums_fees` | enums `payment_method/donation_status/payment_status`; `fee_rules` (bps, versionadas) + seed `padrao-v1` (5% / saque R$3,90); `current_fee_rule()` |
| `0014_donations_payments` | `donations`, `payments` (1:1, `unique(provider,provider_reference)`), `webhook_events` (`unique(provider,event_id)` — §8.4) |
| `0015_payment_functions` | `confirm_donation_payment()` — unidade atômica idempotente (paga pagamento+doação, credita `raised_amount_cents`/`supporters_count`, notifica dono); confere valor |
| `0016_payments_rls` | RLS: `fee_rules` público; `donations`/`payments` só dono/dono-da-campanha/staff; `webhook_events` só staff |
| `0017_drop_public_supporters_fn` | remove RPC SECURITY DEFINER; apoiadores públicos lidos server-side (service_role, colunas seguras) |

**Provedor Pushin Pay** (`lib/payments/`): `PixInProvider` interface + `PushinPayProvider`
(`POST /pix/cashIn`, `GET /transactions/{id}`, `parseWebhook`). Motor de taxas puro
em `lib/payments/fees.ts` (reproduz o exemplo §9.1). Snapshot da regra em cada doação.

Webhook (`/api/webhooks/pushinpay/[token]`): token secreto no path + **verificação
server-to-server obrigatória** (`GET /transactions/{id}`) antes de creditar +
idempotência por `webhook_events`. O corpo do webhook é só gatilho (§8.3).

**Saída:** pagamento atualiza a campanha **uma única vez** ✔ (E2E: form → QR real
Pushin Pay → webhook forjado "paid" **não credita** (GET autoritativo diz `created`)
→ repetição = `duplicate` → `confirm_donation_payment('paid')` credita 1× → 2ª vez
= `already_paid` → valor errado = `amount_mismatch`).

## Fase 3 — Ledger ✅ (aplicada)

| Migration | Conteúdo |
|---|---|
| `0018_ledger` | `wallets`, `ledger_accounts` (6 globais + 3 por carteira, `unique nulls not distinct(wallet_id,code)`), `ledger_transactions` (`idempotency_key UNIQUE`), `ledger_entries` (débito/crédito, `>0`), `wallet_balances` (projeção); funções `private.ensure_wallet` / `account_id` / `recompute_wallet_balance` / **`post_ledger_transaction`** (valida soma=0, ≥2 partidas, idempotente); views `v_ledger_trial_balance` e `v_ledger_imbalanced` (`security_invoker`) |
| `0019_confirm_donation_ledger` | `confirm_donation_payment` agora posta 2 lançamentos: doação confirmada (D CASH_PROVIDER_IN g / C CAMPAIGN_PENDING net + C PLATFORM_REVENUE + C PROVIDER_FEES) e liberação (D PENDING / C AVAILABLE). Continua idempotente |
| `0020_ledger_rls` | RLS somente-leitura: dono vê a própria carteira/extrato; staff vê tudo; nenhuma escrita pelo cliente (§10) |

Convenção: `PROVIDER_FEES` é conta de **acúmulo** (crédito) contra `CASH_PROVIDER_IN`
— estimativa agora, acerto na conciliação (Fase 6). `raised_amount_cents` permanece
como projeção, reconciliável com a soma dos `net` das doações pagas.

**Saída:** cada centavo reconciliável ✔ (E2E: 2 doações confirmadas → `v_ledger_imbalanced`
vazia, `v_ledger_trial_balance` soma global **0**, `wallet_balances.available` = soma
dos nets, re-confirmação = `already_paid` sem novo lançamento).

## Fase 4 — Saques + PIX Out ✅ (aplicada)

| Migration | Conteúdo |
|---|---|
| `0021_withdrawals` | enums `withdrawal_status` / `pix_key_type` / `pix_key_status`; `pix_keys` (valor AES-GCM + hash + máscara), `withdrawals` (timestamps de SLA §11.3, `pix_key_snapshot`), `provider_payouts`, `withdrawal_events` |
| `0022_withdrawal_functions` | **`request_withdrawal`** (lock `wallet_balances FOR UPDATE`, valida chave/cooldown/limites, reserva `AVAILABLE→RESERVED` na mesma TX); **`transition_withdrawal`** (máquina §11.2 + ledger: `paid` = D RESERVED / C CASH_PIXOUT net + C PLATFORM_REVENUE fee; `rejected/failed/canceled` = D RESERVED / C AVAILABLE); **`confirm_withdrawal_payout`** (COMPLETE→paid, FAILED→failed, idempotente) |
| `0023_withdrawals_rls` | RLS somente-leitura: dono vê os seus; `provider_payouts` só staff |

Adapters em `lib/payments/pixout/`: `PixOutProvider` + `GGPixProvider`
(`POST /pix/out`, `GET /transactions/{id}`, `X-API-Key`, base `ggpixapi.com/api/v1`,
IP whitelist obrigatório) + `MockPixOutProvider` (fallback sem credencial — admin
"simula" o desfecho). Webhook `/api/webhooks/ggpix/[token]` (token no path +
verificação server-to-server). Reautenticação por senha na solicitação (§6.2).

**Saída:** saque do início ao fim ✔ (E2E com mock: `request_withdrawal` reserva na
hora · saque acima do disponível **rejeitado** · cooldown **bloqueia** · aprovar →
processar → `confirm('complete')` = pago, ledger `D RESERVED / C CASH_PIXOUT +
C PLATFORM_REVENUE`, `withdrawn += valor` · `confirm('failed')` = `wd_release`
devolve tudo ao disponível · re-confirmação = `already_paid` / `already_failed` ·
`v_ledger_trial_balance` soma **0** em todos os passos).

## Fase 5 — KYC / Risco ✅ (aplicada)

| Migration | Conteúdo |
|---|---|
| `0024_kyc_risk` | `kyc_cases`, `kyc_documents` (bucket privado `kyc-docs`), `risk_flags`, `account_ip_signals`, `blocklist`, `wallet_holds`; conta `CAMPAIGN_HELD` + `wallet_balances.held_cents`; `withdrawals.first_approved_by/at` |
| `0025_risk_functions` | `is_blocklisted`, `submit_basic_kyc` (auto-aprova por consistência com o cadastro), `place_wallet_hold` / `release_wallet_hold` (lançamentos AVAILABLE↔HELD), `assess_withdrawal_risk` (velocity, valor incomum, criação→saque rápido, multi-conta por IP) |
| `0026`–`0029` | `request_withdrawal` + gates: blocklist, KYC básico obrigatório, KYC reforçado no 1º saque / acima do limite; `transition_withdrawal` + **dupla aprovação** de alto valor; `set_user_block` (congela carteira + profile) |
| `0030`–`0032` | limpeza de advisor (KYC summary lida direto da tabela), simplificação do KYC básico (nome + nascimento), fix de cast em `assess_withdrawal_risk` |

Módulo de e-mail `lib/email/resend.ts` (no-op sem `RESEND_API_KEY`). `recordIpSignal`
no login e na solicitação de saque. Documentos de KYC via URL assinada (60 min).

**Saída:** controles mínimos de risco ✔ (E2E: saque sem KYC → bloqueado; KYC básico
auto-aprovado por match; 1º saque sem reforçado → bloqueado; flags de risco geradas
automaticamente; dupla aprovação exige 2 analistas distintos; hold move
AVAILABLE→HELD reversível; bloquear usuário congela carteira; ledger fecha em 0 em
todos os passos).

## Fase 6 — Financeiro / Conciliação ✅ (aplicada)

| Migration | Conteúdo |
|---|---|
| `0033_reconciliation` | `reconciliation_runs`, `reconciliation_items`; `settle_provider_fee_in` (liquida o custo real do PIX In: `D PROVIDER_FEES / C CASH_PROVIDER_IN` + registra divergência), `reconcile_ledger_internal` (autoconferência: soma global do ledger, `CASH_PIXOUT` × soma dos net pagos) |
| `0034_reconciliation_rls` | RLS: só staff lê |
| `0035_ops_cron_functions` | `expire_stale_payments` (cobranças PIX paradas > 25h), `withdrawals_near_sla` (fila próxima das 24h) |

`lib/reconciliation/service.ts`: `runPixInReconciliation` / `runPixOutReconciliation`
(comparam status/valor contra o provedor via `getCharge`/`getPayout`, registram o
`gatewayFee` real da GGPix) / `runLedgerInternalReconciliation`. Rotas de cron
`/api/cron/reconcile` (diária) e `/api/cron/daily-ops` (horária), autenticadas por
`CRON_SECRET`. `/admin/conciliacao` (rodar + fila de divergências + resolver).

**Saída:** divergências detectáveis e tratáveis ✔.

## Fase 7 — Hardening ✅ (aplicada)

| Migration | Conteúdo |
|---|---|
| `0036_lgpd_data_requests` | `data_requests` (export/deletion) + RLS; `anonymize_user` (remove PII do profile e das chaves PIX, torna doações anônimas, congela carteira, bloqueia conta — mantém registros financeiros para retenção legal) |

- **CSP + HSTS** e headers de segurança em `next.config.mjs` (`frame-ancestors 'none'`, `form-action 'self'`, allowlist de `connect-src`/`img-src`).
- **LGPD**: `/painel/privacidade` (baixar dados via `/api/me/export`, pedir exclusão), fila `/admin/lgpd` + ação de anonimização.
- Páginas institucionais reais: `/termos`, `/privacidade`, `/politica-campanhas`, `/como-funciona`, `/seguranca`, `/ajuda`.
- **Observabilidade**: `lib/observability/report.ts` (Sentry via Store API, sem SDK) + `app/global-error.tsx` + `/api/client-error`.
- Docs: `DEPLOY.md`, `RUNBOOK.md`, `GO-LIVE.md`.

**Saída:** go-live checklist mapeado (o que é código está feito; o resto é jurídico/config — ver `GO-LIVE.md`).

## Fase 8 — Evolução (não iniciada)

Cartão, recorrência, times, app nativo, split nativo. "Somente após estabilidade do core" (§27).

---

### Convenções

- Prefixo numérico sequencial `NNNN_snake_case.sql`.
- DDL idempotente onde possível (`if not exists`, `drop policy if exists`).
- Toda migration com efeito em RLS → rodar advisor de segurança depois.
- Regerar `lib/database.types.ts` após cada migration.
- Valores monetários: `bigint` em centavos, sufixo `_cents` no nome da coluna.
