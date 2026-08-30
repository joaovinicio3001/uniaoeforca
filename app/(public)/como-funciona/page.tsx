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
        <li>Crie sua conta gratuita e confirme sua identidade.</li>
        <li>Monte a campanha — título, categoria, meta, história e fotos — e envie para análise.</li>
        <li>Assim que for aprovada, compartilhe o link com todo mundo.</li>
        <li>Acompanhe as doações e o saldo em tempo real pelo painel.</li>
        <li>Quando quiser, solicite o repasse do saldo disponível para a sua chave PIX.</li>
      </ol>

      <h2>Para quem quer doar</h2>
      <ol>
        <li>Abra a página da campanha e clique em &ldquo;Quero ajudar&rdquo;.</li>
        <li>Escolha o valor e informe seu nome (ou doe anonimamente). Não precisa ter conta.</li>
        <li>Pague com PIX pelo QR Code ou pelo copia-e-cola.</li>
        <li>A doação entra na campanha automaticamente assim que o pagamento é confirmado.</li>
      </ol>

      <h2>Como o dinheiro é tratado</h2>
      <p>
        Cada doação e cada saque ficam registrados e disponíveis para você
        conferir a qualquer momento. O saldo nunca é alterado manualmente e é
        conferido todos os dias com os meios de pagamento. É transparência de
        verdade: você acompanha a origem de cada centavo.
      </p>

      <div className="not-prose mt-6">
        <Button asChild>
          <Link href="/cadastro">Criar conta</Link>
        </Button>
      </div>
    </LegalPage>
  );
}
