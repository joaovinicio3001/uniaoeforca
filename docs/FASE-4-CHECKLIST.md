# Fase 4 — Saques + PIX Out (GGPix) · Checklist de aceite

Critério de saída (§27): **"Saque sandbox do início ao fim."**
Critérios do MVP financeiro (§28): reserva imediata; sem double-spend; aprovação
auditada; falha de PIX Out não some com o dinheiro.

## Provedor / contrato (GGPix)
- [x] base `https://ggpixapi.com/api/v1` (contingência `ggatepixapi.com/api/v1`), header `X-API-Key`
- [x] `POST /pix/out` (`amountCents` min 100, `pixKey`, `pixKeyType` CPF|CNPJ|EMAIL|PHONE|EVP|COPIAECOLA, `externalId` idempotência)
- [x] `GET /transactions/{id}` — fonte de verdade; status PENDING|COMPLETE|FAILED|CANCELED
- [x] webhook sem assinatura documentada → token no path + verificação server-to-server
- [x] **IP whitelist obrigatório** no painel GGPix — anotado para o usuário
- [x] Sem `GGPIX_API_KEY` → `MockPixOutProvider` (admin simula desfecho); troca automática quando a key existir

## Banco (migrations 0021–0023)
- [x] `pix_keys` — valor cifrado (AES-256-GCM, `lib/security/crypto`), `value_hash` p/ dedup, `value_masked` p/ UI, cooldown por `created_at`
- [x] `withdrawals` — `amount/fee/net` (check `net = amount - fee`), timestamps de SLA (§11.3), `pix_key_snapshot` (admin não redigita — §34.4)
- [x] `provider_payouts` (1:1), `withdrawal_events` (trilha)
- [x] RLS somente-leitura; escrita via `SECURITY DEFINER` / service_role
- [x] Advisor de segurança sem novos alertas

## Funções transacionais
- [x] `request_withdrawal` — `SELECT ... FOR UPDATE` no `wallet_balances`; valida mínimo/máximo, limite diário, chave verificada + fora do cooldown, carteira ativa, `available >= amount`; **reserva `AVAILABLE→RESERVED` no mesmo lançamento**
- [x] `transition_withdrawal` — máquina §11.2; `paid` posta `D CAMPAIGN_RESERVED / C CASH_PIXOUT(net) / C PLATFORM_REVENUE(fee)` e `withdrawn += amount`; `rejected/failed/canceled` posta `D RESERVED / C AVAILABLE` (compensatório)
- [x] `confirm_withdrawal_payout` — COMPLETE→paid, FAILED/CANCELED→failed; confere `net`; idempotente
- [x] Aprovação exige alçada `withdrawal:approve` (financeiro/admin); análise `withdrawal:review` (analista+)

## Telas
- [x] `/painel/saques` — histórico + saldo disponível + CTA
- [x] `/painel/saques/chaves` — cadastrar/remover chave PIX (cifrada)
- [x] `/painel/saques/nova` — chave + valor + resumo (taxa/líquido/prazo 24h) + **reautenticação por senha** (§6.2)
- [x] `/painel/saques/[id]` — timeline de status + polling + cancelar (se requested/under_review)
- [x] `/admin/saques` — fila por status (SLA, andamento, pagos, problemas)
- [x] `/admin/saques/[id]` — identidade/saldo/chave, iniciar análise, aprovar (+ dispara payout), rejeitar (motivo), consultar status, **simular (mock)**

## Verificação E2E executada (SQL + mock provider)
- [x] Doação confirmada → carteira com `available` = R$ 920,00
- [x] `request_withdrawal(R$ 500)` → `requested`, **available 420 / reserved 500 na hora**, `wd_reserve` = `D AVAILABLE / C RESERVED`, ledger soma 0
- [x] `request_withdrawal(R$ 450)` com só R$ 420 → **rejeitado** ("Saldo disponível insuficiente") — sem 2º saque criado
- [x] `request_withdrawal` com chave recém-criada → **bloqueado por cooldown**
- [x] aprovar → processing → `confirm('complete', net)` → **pago**; `wd_paid` = `D RESERVED 50000 / C CASH_PIXOUT 49610 / C PLATFORM_REVENUE 390`; `reserved 0 / withdrawn 50000`; 1 notificação; `confirm` de novo → `already_paid`
- [x] outro saque → processing → `confirm('failed')` → **failed** com motivo; `wd_release` = `D RESERVED / C AVAILABLE` → **valor de volta ao disponível**; `confirm` de novo → `already_failed`
- [x] `v_ledger_trial_balance` soma global **0** e `v_ledger_imbalanced` vazia em todos os passos
- [x] `tsc` · `next lint` · `next build` (36 rotas) · **65 testes Vitest** (11 de saques/cripto)
- [x] Dados de teste removidos; `global_sum = 0` preservado

## Pendências do usuário
- [ ] Credencial real **GGPIX_API_KEY** + `GGPIX_WEBHOOK_SECRET` no `.env.local` (hoje usa mock)
- [ ] Definir **`SECRETS_ENC_KEY`** real (64 hex) — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Whitelistar o IP do servidor no painel da GGPix (PIX Out não funciona sem isso)
- [ ] Ativar Leaked Password Protection no Supabase (pendência da Fase 3)

## Fora do escopo desta fase
- Verificação real de titularidade da chave PIX (nome/microdepósito) — Fase 5 (KYC)
- Holds de risco / dupla aprovação de alto valor (§14) — Fase 5
- Job assíncrono de dispatch/retry de payout — hoje o dispatch é síncrono no "aprovar"
- Conciliação GGPix × `provider_payouts` e acerto do `gatewayFee` real — Fase 6
