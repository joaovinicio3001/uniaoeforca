# Fase 3 — Ledger de dupla entrada · Checklist de aceite

Critério de saída (§27): **"Cada centavo reconciliável."**
Critérios do MVP financeiro (§28): soma do ledger fecha em zero por transação;
correções por lançamento compensatório; tudo em centavos inteiros.

## Modelo (doc §10, §18)
- [x] `wallets` — 1 por usuário beneficiário (criada sob demanda por `private.ensure_wallet`)
- [x] `ledger_accounts` — 6 globais (`CASH_PROVIDER_IN`, `CASH_PIXOUT`, `PLATFORM_REVENUE`, `PROVIDER_FEES`, `REFUND_RESERVE`, `WITHDRAWAL_PAYABLE`) + 3 por carteira (`CAMPAIGN_PENDING/AVAILABLE/RESERVED`); `unique nulls not distinct (wallet_id, code)`
- [x] `ledger_transactions` — `idempotency_key UNIQUE`, `reference_type/id`, `campaign_id` para relatório por campanha
- [x] `ledger_entries` — `direction` débito/crédito, `amount_cents > 0`, `on delete restrict` (imutável)
- [x] `wallet_balances` — projeção mantida transacionalmente (`pending/available/reserved/withdrawn`)
- [x] `PROVIDER_FEES` documentada como conta de acúmulo (crédito) contra `CASH_PROVIDER_IN`

## Escrita
- [x] Único caminho: `private.post_ledger_transaction(...)` — valida ≥ 2 partidas, `SUM(débitos) = SUM(créditos)`, recalcula saldos das carteiras tocadas; idempotente por `idempotency_key`
- [x] `confirm_donation_payment` posta 2 lançamentos por doação: **confirmação** e **liberação** (hold 0 nesta fase)
- [x] Nenhuma policy de INSERT/UPDATE/DELETE em tabelas do ledger — só service_role / SECURITY DEFINER
- [x] Idempotência dupla: guarda por `payments.status='paid'` + `idempotency_key` das transações

## Leitura / RLS (doc §34.7)
- [x] `wallets` / `wallet_balances` / `ledger_entries` — dono vê o seu; staff vê tudo
- [x] `ledger_transactions` — dono vê as da sua campanha; staff tudo
- [x] `ledger_accounts` globais visíveis; por-carteira só do dono
- [x] Views `v_ledger_*` com `security_invoker = true` (respeitam RLS)

## Telas
- [x] `/painel/carteira` — 4 cards (pendente/disponível/reservado/sacado) + extrato do ledger
- [x] `/admin/financeiro` — balancete por conta + selo "ledger fecha em zero" + lista de transações desbalanceadas (deve ser vazia)
- [x] `/painel/campanhas/[id]` — card Financeiro (líquido, taxa plataforma, custo provedor) como projeção do ledger

## Verificação E2E executada (SQL, contra o banco remoto)
- [x] 2 doações confirmadas via `confirm_donation_payment('paid', gross)` → `credited`
- [x] Lançamento de doação: `D CASH_PROVIDER_IN 10000` = `C CAMPAIGN_PENDING 9200 + C PLATFORM_REVENUE 500 + C PROVIDER_FEES 300` (doc §9.1 escalado)
- [x] Lançamento de liberação: `D CAMPAIGN_PENDING 9200` = `C CAMPAIGN_AVAILABLE 9200`
- [x] `v_ledger_imbalanced` → **0 linhas**; `v_ledger_trial_balance` soma global → **0**
- [x] `wallet_balances`: pending 0, **available 13800** (= soma dos nets), reserved 0
- [x] `campaigns.raised_amount_cents` = 13800 (reconciliável com soma dos nets)
- [x] Re-confirmação → `already_paid`, **nenhum lançamento novo** (`tx_count` inalterado)
- [x] `tsc` · `next lint` · `next build` (29 rotas) · **54 testes Vitest** (4 de ledger)
- [x] Advisor de segurança: só `auth_leaked_password_protection` (toggle de Auth no dashboard — ver abaixo)
- [x] Dados de teste removidos; contas globais e `global_sum=0` preservados

## Pendências do usuário
- [ ] Ativar **Leaked Password Protection** no Supabase (Dashboard → Authentication → Policies) — checa senhas contra HaveIBeenPwned (§6.2, §15)

## Fora do escopo desta fase
- Saques / PIX Out (Fase 4) — `CASH_PIXOUT`, `WITHDRAWAL_PAYABLE` e `CAMPAIGN_RESERVED` passam a se mover lá
- Holds de risco (pending fica retido) — Fase 5; hoje a liberação é imediata
- Estorno/refund/chargeback com `REFUND_RESERVE` — Fase 6
- Conciliação `CASH_PROVIDER_IN` (livro) × extrato real do Pushin Pay, e acerto de `PROVIDER_FEES` — Fase 6
