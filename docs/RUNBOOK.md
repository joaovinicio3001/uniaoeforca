# Runbook operacional

Referência rápida para incidentes. Doc §29, §33.

## Rotina diária (§29)

- [ ] Revisar fila de saques e SLA (`/admin/saques` filtro "Fila"; alerta `ops_sla_warning`).
- [ ] Revisar campanhas/contas sinalizadas (`/admin/risco`, `/admin/campanhas`).
- [ ] Conferir conciliação PIX In e PIX Out (`/admin/conciliacao` — roda sozinha às 06:00 UTC).
- [ ] Conferir saldo do provedor de PIX Out (GGPix) vs. obrigações internas (`/admin/financeiro`).
- [ ] Tratar `reconciliation_items` abertos e falhas de payout.
- [ ] Responder denúncias e tickets críticos.
- [ ] Registrar qualquer ajuste por lançamento de ledger, com motivo e aprovação (nunca "editar saldo").

## Incidente: PIX Out (GGPix) indisponível

Sintomas: `dispatchPayout` falhando, `provider_payouts` parados em `pending`, saques presos em `approved`.

1. Confirmar com a GGPix / status page. Verificar IP whitelist e validade da `GGPIX_API_KEY`.
2. **Não** reprovar os saques — o valor está reservado e seguro. Comunicar os beneficiários sobre atraso.
3. Quando normalizar: no `/admin/saques/[id]` de cada saque `approved`, usar **"Reenviar PIX Out"**.
4. Para saques já em `processing` sem confirmação: **"Consultar status no provedor"**.
5. Se a indisponibilidade for longa: avaliar `PIXOUT_PROVIDER=mock` **apenas** para manter testes, nunca para pagar de verdade. Documentar a decisão.

## Incidente: webhook não processado

`webhook_events` com `status='error'` ou `provider_payouts`/`payments` divergentes.

1. O polling (`/api/payments/[id]/status`, `/api/withdrawals/[id]/payout-status`) já reconfirma server-to-server; abrir a tela do pagamento/saque força a checagem.
2. Rodar `/admin/conciliacao → PIX In / PIX Out` manualmente.
3. Como último recurso, no SQL Editor: `select public.confirm_donation_payment(...)` / `confirm_withdrawal_payout(...)` com os dados **da consulta autenticada ao provedor** (nunca do corpo do webhook).

## Incidente: divergência de ledger

`/admin/financeiro` mostra "Divergência no ledger" ou `v_ledger_imbalanced` não vazia.

1. **Parar** aprovações de saque até entender a causa.
2. `select * from public.v_ledger_imbalanced;` — identifica a(s) transação(ões).
3. Nunca deletar/editar lançamentos. Corrigir com **lançamento compensatório** (via função dedicada ou, em emergência, `private.post_ledger_transaction` com `idempotency_key` explícito e descrição do incidente).
4. Registrar no `audit_logs` e abrir `reconciliation_item` manual.

## Incidente: suspeita de fraude em conta

1. `/admin/risco → Blocklist → Bloquear` (congela carteira + perfil).
2. Se houver saldo em análise: `/admin/risco → Holds → Reter`.
3. Revisar campanhas do usuário (`/admin/campanhas`) — pausar/bloquear se necessário.
4. Documentar evidências. Reverter (`Desbloquear` / `Liberar`) se a análise inocentar.

## Contatos

- Suporte a provedores: Pushin Pay, GGPix (dados no painel de cada um).
- Banco de dados: Supabase Dashboard → Support.
- Encarregado LGPD: `dpo@uniaoeforca.com.br`.
