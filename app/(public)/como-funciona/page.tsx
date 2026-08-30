import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/layout/legal-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Do cadastro à retirada do saldo: como a União & Força funciona.",
};

export default function ComoFuncionaPage() {
  return (
    <LegalPage title="Como funciona">
      <h2>Para quem quer arrecadar</h2>
      <ol>
        <li>Crie sua conta e faça a verificação de identidade.</li>
        <li>Monte a campanha (título, categoria, meta, história e imagens) e envie para análise.</li>
        <li>Após aprovada, compartilhe o link público.</li>
        <li>Acompanhe doações e saldo em tempo real no painel.</li>
        <li>Quando houver saldo disponível, solicite o saque via PIX.</li>
      </ol>

      <h2>Para quem quer doar</h2>
      <ol>
        <li>Abra a página da campanha e clique em &ldquo;Quero ajudar&rdquo;.</li>
        <li>Escolha o valor e informe seu nome (ou doe anonimamente). Não é preciso ter conta.</li>
        <li>Pague com PIX pelo QR Code ou copia-e-cola.</li>
        <li>A confirmação é automática assim que o provedor aprova — nunca antes.</li>
      </ol>

      <h2>Como o dinheiro é tratado</h2>
      <p>
        Cada movimentação é registrada em um livro-razão (ledger) de dupla
        entrada, imutável e auditável. O saldo é sempre calculado a partir dele —
        nunca editado à mão. Isso permite conciliar cada centavo com os
        provedores de pagamento.
      </p>

      <div className="not-prose mt-6">
        <Button asChild>
          <Link href="/cadastro">Criar conta</Link>
        </Button>
      </div>
    </LegalPage>
  );
}
