import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Regras de uso da plataforma União & Força para criadores e doadores.",
};

export default function TermosPage() {
  return (
    <LegalPage title="Termos de Uso" updated="29/08/2026">
      <p>
        Ao usar a plataforma <strong>União &amp; Força</strong> você concorda com
        estes termos. Este é um modelo operacional; a versão vinculante deve ser
        revisada por assessoria jurídica antes do lançamento, especialmente
        quanto ao enquadramento do recebimento de valores de terceiros e do
        repasse a beneficiários.
      </p>

      <h2>1. O serviço</h2>
      <p>
        A plataforma permite criar campanhas de arrecadação, receber
        contribuições por PIX e solicitar o saque do saldo acumulado. A
        confirmação de pagamentos depende exclusivamente do retorno validado dos
        provedores de pagamento.
      </p>

      <h2>2. Elegibilidade e conta</h2>
      <ul>
        <li>É necessário ter 18 anos ou mais e fornecer dados verdadeiros.</li>
        <li>Você é responsável por manter a senha em sigilo e pela atividade da sua conta.</li>
        <li>Podemos exigir verificação de identidade (KYC) antes de saques.</li>
      </ul>

      <h2>3. Regras para campanhas</h2>
      <p>
        Campanhas passam por moderação. É proibido usar a plataforma para fins
        ilícitos, enganosos, difamatórios, que violem direitos de terceiros ou as{" "}
        <a href="/regras-e-seguranca">Regras e segurança</a>. Podemos pausar,
        bloquear ou remover campanhas e reter valores em caso de suspeita de
        fraude ou ordem legal.
      </p>

      <h2>4. Custos</h2>
      <p>
        Os custos vigentes estão em <a href="/custos">/custos</a> e são
        registrados em cada doação no momento da transação. Mudanças de taxa não
        afetam pagamentos já realizados.
      </p>

      <h2>5. Saques</h2>
      <p>
        O saque usa apenas saldo disponível, reserva o valor imediatamente e
        passa por análise operacional, com objetivo de processamento em até 24
        horas, sujeito a validações de risco e às condições dos provedores. Falha
        no pagamento devolve o valor ao saldo disponível.
      </p>

      <h2>6. Responsabilidade</h2>
      <p>
        A plataforma disponibiliza a infraestrutura; a responsabilidade pelo
        conteúdo, pela veracidade e pela destinação dos recursos é de quem cria a
        campanha. Doações são voluntárias e, salvo disposição legal, não
        reembolsáveis pela plataforma.
      </p>

      <h2>7. Encerramento</h2>
      <p>
        Você pode encerrar sua conta a qualquer momento em Painel → Privacidade.
        Podemos suspender contas que violem estes termos.
      </p>

      <h2>8. Contato</h2>
      <p>
        <a href="mailto:suporte@uniaoeforca.com.br">suporte@uniaoeforca.com.br</a>
      </p>
    </LegalPage>
  );
}
