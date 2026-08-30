import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Segurança",
  description: "As medidas de segurança e antifraude da União & Força.",
};

export default function SegurancaPage() {
  return (
    <LegalPage title="Segurança">
      <h2>Da sua conta</h2>
      <ul>
        <li>Senha forte obrigatória e verificação de e-mail.</li>
        <li>Reautenticação por senha para ações sensíveis, como solicitar saque.</li>
        <li>Sessões podem ser revogadas; MFA obrigatório para a equipe administrativa.</li>
      </ul>

      <h2>Do dinheiro</h2>
      <ul>
        <li>Doações só são creditadas após confirmação validada do provedor — nunca pelo navegador.</li>
        <li>Todo webhook é idempotente: repetições não duplicam efeitos.</li>
        <li>Saldo em livro-razão imutável; correções só por lançamento compensatório.</li>
        <li>Solicitação de saque reserva o valor na hora e impede gasto duplo.</li>
        <li>
          Falha de PIX Out devolve o valor ao saldo disponível — nada
          &ldquo;some&rdquo;.
        </li>
      </ul>

      <h2>Antifraude</h2>
      <ul>
        <li>Verificação de identidade (KYC) antes do primeiro saque e para valores maiores.</li>
        <li>Checagens de velocidade, valor incomum e múltiplas contas.</li>
        <li>Possibilidade de reter saldo e bloquear contas sob análise, sem apagar histórico.</li>
        <li>Dupla aprovação para saques de alto valor.</li>
      </ul>

      <h2>Da plataforma</h2>
      <ul>
        <li>HTTPS obrigatório com HSTS e política de segurança de conteúdo (CSP).</li>
        <li>Isolamento de dados por usuário no banco (RLS) e cifra de dados sensíveis em repouso.</li>
        <li>Trilha de auditoria de todas as ações administrativas e financeiras.</li>
        <li>Backups criptografados e conciliação diária com os provedores.</li>
      </ul>

      <p>
        Encontrou uma vulnerabilidade? Escreva para{" "}
        <a href="mailto:seguranca@uniaoeforca.com.br">
          seguranca@uniaoeforca.com.br
        </a>
        .
      </p>
    </LegalPage>
  );
}
