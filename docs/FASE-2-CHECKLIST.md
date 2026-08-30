# Fase 2 — PIX In (Pushin Pay) · Checklist de aceite

Critério de saída (§27): **"Pagamento sandbox atualiza campanha uma única vez."**
Critérios do MVP financeiro relevantes (§28): idempotência, sem duplo crédito,
taxa histórica imutável, tudo em centavos inteiros.

## Provedor / contrato
- [x] Base prod `https://api.pushinpay.com.br/api` / sandbox `…-sandbox…` — token fornecido é de **produção** (`PUSHINPAY_BASE_URL` fixado em prod no `.env.local`)
- [x] `POST /pix/cashIn` (`value` em centavos, min 50, `webhook_url`) → `{ id, qr_code, qr_code_base64 (data URI), status, value }`
- [x] `GET /transactions/{id}` (plural) — fonte de verdade; `value` vem como string; `id` retorna em CAIXA ALTA → normalizado para minúsculo em todo o adapter
- [x] Webhook do provedor **não tem assinatura documentada** → não inventamos secret de assinatura

## Banco (migrations 0013–0017)
- [x] `fee_rules` versionadas (bps) + seed `padrao-v1` (5% / saque R$ 3,90); `current_fee_rule()`
- [x] `donations` (bruto, taxa plataforma, taxa provedor, líquido, snapshot da regra)
- [x] `payments` 1:1, `unique(provider, provider_reference)`
- [x] `webhook_events` `unique(provider, event_id)` (idempotência — §8.4)
- [x] `confirm_donation_payment()` — transacional, `for update`, idempotente
- [x] RLS: `donations`/`payments` só dono/dono-da-campanha/staff; `webhook_events` só staff; `fee_rules` público
- [x] Advisor de segurança: **sem alertas**

## Fluxo do doador (§4.2, §8.2)
- [x] `/campanhas/[slug]/contribuir` — valores sugeridos + custom, anônimo, nome, mensagem; só PIX (cartão = Fase 8)
- [x] Server action cria `donation` + `payment` + cobrança no provedor (service_role); falha do provedor → marca `failed` e mensagem amigável
- [x] `/campanhas/[slug]/contribuir/[donationId]` — QR (base64), copia-e-cola com botão copiar, polling de status
- [x] Estados terminais na tela: `paid` (sucesso), `expired`/`failed` (tentar de novo)
- [x] Visitante não autenticado pode doar (`donor_user_id` nulo)

## Confirmação (regra de ouro — §8.3)
- [x] `/api/webhooks/pushinpay/[token]` — token comparado em tempo constante; corpo JSON ou form-urlencoded
- [x] **Nunca credita pelo corpo do webhook** — sempre reconfirma via `GET /transactions/{id}` autenticado
- [x] `/api/payments/[donationId]/status` — polling do frontend; reconfirma no provedor; throttle 1×/3s por doação; rede de segurança se o webhook atrasar
- [x] Crédito aplica `net_amount_cents` a `raised_amount_cents` e +1 em `supporters_count`; notifica o dono

## Verificação E2E executada (com token real de produção)
- [x] Form → cobrança real Pushin Pay criada (QR EMV + base64 válidos), redirect para a tela de pagamento
- [x] `donation`: bruto 500, taxa plat. 25 (5%), taxa prov. 77 (mín.), líquido 398, snapshot gravado
- [x] Webhook **forjado** `{status:"paid"}` × 3 → `updated` / `duplicate` — **donation segue `pending`, `raised`=0, `supporters`=0** (GET autoritativo do provedor diz `created`)
- [x] `confirm_donation_payment('paid', 500)` → `credited` (1×); repetido → `already_paid`; valor errado → `amount_mismatch`
- [x] Pós-crédito: `raised`=398, `supporters`=1, 1 notificação ao dono; tela de pagamento e página pública refletem
- [x] `tsc` · `next lint` · `next build` (27 rotas) · **50 testes Vitest** (11 de pagamentos)
- [x] Dados de teste removidos. (Cobranças de teste no Pushin Pay ficam pendentes e **expiram sozinhas** em 24h.)

## Telas administrativas / painel
- [x] `/painel/contribuicoes` — histórico do doador (com link "concluir pagamento" para pendentes)
- [x] `/admin/doacoes` — GMV pago, receita de taxa, pendentes, últimas doações, webhooks recebidos
- [x] `/taxas` — regra ativa + exemplo contábil (§9.1) a partir do banco

## Fora do escopo desta fase
- **Ledger de dupla entrada** (Fase 3) — hoje o crédito ajusta direto `raised_amount_cents` (projeção); a Fase 3 passa isso pelo ledger
- Estorno / refund / chargeback (enums existem; tratamento na Fase 6)
- `split_rules` do Pushin Pay (repasse nativo) — Fase 8
- Conciliação Pushin Pay × interno (Fase 6)
- Reconciliação do custo real do provedor vs. estimativa (`provider_fee_cents` hoje é estimado: 3% mín. R$ 0,77)
