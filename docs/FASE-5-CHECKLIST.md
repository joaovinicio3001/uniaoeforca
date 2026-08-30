# Fase 5 — KYC / Risco · Checklist de aceite

Critério de saída (§27): **"Controles mínimos de risco implementados."** (doc §14)

## KYC (doc §14, §34.6)
- [x] `kyc_cases` (basic/enhanced · pending/in_review/approved/rejected/expired) + `kyc_documents`
- [x] Documentos em bucket **privado** `kyc-docs` (sem leitura pública; staff via URL assinada de 60 min)
- [x] `submit_basic_kyc` — auto-aprova se nome + data de nascimento batem com o cadastro; senão vai para análise
- [x] Verificação reforçada: upload de frente do documento + selfie → caso `enhanced` `pending` para análise manual
- [x] `/painel/kyc` (status + formulários) · `/admin/kyc` (fila) · `/admin/kyc/[id]` (comparação enviado × cadastro, docs assinados, aprovar/reprovar + nível de risco)
- [x] **Gate no saque**: sem KYC básico → bloqueado; 1º saque (ou acima de `KYC_ENHANCED_THRESHOLD_CENTS`) sem reforçado → bloqueado
- [x] Notificação in-app + e-mail (Resend, no-op sem key) na decisão de KYC

## Risco (doc §14)
- [x] `assess_withdrawal_risk` roda automático ao solicitar saque → gera `risk_flags`:
      velocity (contagem/soma 24h), valor incomum, criação→saque < 24h, blocklist, multi-conta por IP
- [x] `/admin/risco` — flags abertas (resolver/descartar), blocklist de usuários, holds de saldo
- [x] Flags do saque aparecem no `/admin/saques/[id]` antes da aprovação
- [x] `account_ip_signals` alimentado no login e na solicitação de saque (IP com hash+pepper)

## Blocklist e holds (doc §7.3, §14)
- [x] `set_user_block` — bloquear congela `wallets.status='frozen'` + `profiles.status='blocked'` + entrada na blocklist; `request_withdrawal` passa a recusar
- [x] Totalmente reversível (desbloquear restaura carteira e perfil)
- [x] `place_wallet_hold` / `release_wallet_hold` — lançamento `AVAILABLE↔HELD` (novo `CAMPAIGN_HELD` por carteira); `wallet_balances.held_cents`; `/painel/carteira` mostra "Retido (risco)"

## Dupla aprovação de alto valor (doc §14)
- [x] `transition_withdrawal` com `p_high_value_cents`: 1ª aprovação registra `first_approved_by` e retorna `needs_second_approval` (status não muda)
- [x] Mesmo analista tentando de novo → `same_approver`; analista diferente → aprovado
- [x] UI do admin mostra "primeira aprovação registrada / aguardando 2ª"

## Verificação E2E executada (SQL, contra o banco)
- [x] Saque sem KYC → `{ok:false, kyc_required:'basic'}`
- [x] `submit_basic_kyc` nome errado → `in_review`; nome/nascimento corretos → `approved` (auto)
- [x] Com básico, sem reforçado, 1º saque → `{ok:false, kyc_required:'enhanced'}`
- [x] Com reforçado aprovado, saque R$ 6.000 → criado; flags geradas: `velocity_withdrawals`, `unusual_amount`, `fast_create_withdraw` (todas warning)
- [x] Dupla aprovação: 1ª → `needs_second_approval` (status `under_review`); mesmo analista → `same_approver`; 2º analista → `approved` (`first_approved_by`=A, `reviewed_by`=B)
- [x] `place_wallet_hold(R$ 1.000)` → `available` −1000, `held` +1000, lançamento `D AVAILABLE / C HELD`; `release` reverte
- [x] `set_user_block(true)` → profile `blocked`, wallet `frozen`, `request_withdrawal` → "Conta bloqueada"; `set_user_block(false)` restaura
- [x] `v_ledger_trial_balance` soma global **0** e `v_ledger_imbalanced` vazia em todos os passos
- [x] `tsc` · `next lint` · `next build` (41 rotas) · **65 testes Vitest**
- [x] Advisor de segurança: só `auth_leaked_password_protection` (toggle de Auth). Dados de teste removidos.

## Pendências do usuário
- [ ] `RESEND_API_KEY` no `.env.local` (e-mail hoje é no-op)
- [ ] Ativar Leaked Password Protection no Supabase (pendência desde a Fase 3)

## Fora do escopo desta fase
- Verificação documental por PSP externo (OCR/liveness) — hoje a `enhanced` é análise humana
- `cpf_encrypted` via Supabase Vault — a coluna existe; a migração fica para o hardening
- Device fingerprinting (só IP nesta fase); multi-conta por CPF/chave PIX (enum existe, regra não)
- Score de risco numérico consolidado e auto-hold — hoje as flags são qualitativas e a ação é manual
