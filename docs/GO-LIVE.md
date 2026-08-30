# Checklist antes do lançamento (doc §33)

Estado: **B = feito no código/infra deste repo · U = depende de você · J = jurídico/externo**

## Contratos e enquadramento
- [ ] **J** Contrato dos provedores revisado para o modelo "receber de terceiros e repassar a beneficiários" (Pushin Pay, GGPix).
- [ ] **J** Definição jurídica de quem recebe a doação e quando ocorre o repasse.
- [ ] **J** Exigências de KYC / PLD-FT / monitoramento / retenção validadas com especialista.
- [ ] **J** Política de estorno, devolução, fraude e campanha ilícita.
- [ ] **J** Tributação e documentação fiscal da taxa da plataforma.
- [ ] **J** Termos de Uso e Política de Privacidade revisados e publicados (rascunhos em `/termos`, `/privacidade`).

## Pagamentos
- [ ] **B** Fluxo PIX In (Pushin Pay) — cobrança, webhook, idempotência, confirmação server-to-server.
- [ ] **B** Fluxo PIX Out (GGPix) — reserva atômica, aprovação, payout, compensação em falha.
- [ ] **U** Testar PIX In e PIX Out em **produção controlada** (valores baixos, pagando de verdade uma vez).
- [ ] **U** IPs do Fixie whitelistados na GGPix; `GGPIX_WEBHOOK_SECRET` configurado.
- [ ] **B** Plano de contingência se PIX Out estiver indisponível (ver `RUNBOOK.md`).
- [ ] **B** Regras de prazo de saque (até 24h) comunicadas no painel, termos e ajuda.

## Financeiro
- [ ] **B** Motor de taxas configurável e exibido com transparência (`/taxas`, snapshot por doação).
- [ ] **B** Ledger de dupla entrada + conciliação diária (`/admin/conciliacao`, cron).
- [ ] **U** Definir liquidez operacional mínima no PIX Out antes de aprovar pagamentos (doc §34.12).
- [ ] **U** Acerto do custo real do provedor de PIX In (Pushin Pay não expõe fee na API — precisa de extrato/relatório).

## Segurança
- [ ] **B** MFA no admin — *habilitar TOTP em Authentication → MFA e exigir para papéis staff* (o RBAC já separa; a exigência de AAL2 no `/admin` é o passo final).
- [ ] **U** Rate limiting / WAF no Cloudflare (o in-memory do app é só fallback de 1 instância).
- [ ] **B** Headers de segurança (CSP, HSTS) em `next.config.mjs`.
- [ ] **U** "Leaked Password Protection" no Supabase (Pro plan).
- [ ] **B** Logs sem PII sensível; trilha de auditoria de ações administrativas.
- [ ] **U** Backups criptografados + teste de restauração (Supabase PITR).
- [ ] **U** SAST / dependency scanning no CI (GitHub: Dependabot + `npm audit` gate).
- [ ] **J/U** Pentest antes do financeiro real; corrigir falhas críticas.

## Operação
- [ ] **B** Runbook de incidente financeiro (`RUNBOOK.md`).
- [ ] **B** Processo de atendimento e denúncia (`/ajuda`, botão de denúncia na campanha, fila `/admin/campanhas`).
- [ ] **B** Observabilidade: `SENTRY_DSN` + alertas (o reporte já existe; configurar o projeto Sentry e alertas).
- [ ] **B** Jobs diários: conciliação + expiração de cobranças + alerta de SLA (Vercel Cron).

## LGPD (§16)
- [ ] **B** Canal para solicitações do titular (`/painel/privacidade`: exportar dados, pedir exclusão) + fila `/admin/lgpd` + `anonymize_user`.
- [ ] **J** Política de retenção e deleção/anonimização com prazos definidos.
- [ ] **J** Contrato/DPA com cada operador (Supabase, Bunny, Pushin Pay, GGPix, Resend).
- [ ] **B** Registro de incidentes (`audit_logs`) e plano de resposta (`RUNBOOK.md`).
- [ ] **J** Avaliação de impacto (DPIA) para o tratamento financeiro/KYC.
