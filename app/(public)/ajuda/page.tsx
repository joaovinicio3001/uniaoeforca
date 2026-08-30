import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Central de ajuda" };

const FAQ: [string, string][] = [
  [
    "Preciso ter conta para doar?",
    "Não. Doações por PIX podem ser feitas sem login. Conta só é necessária para criar campanhas e sacar.",
  ],
  [
    "Quando o dinheiro cai na campanha?",
    "Assim que o provedor de pagamento confirma o PIX. A tela de pagamento atualiza sozinha.",
  ],
  [
    "Quanto tempo leva o saque?",
    "O objetivo é analisar e processar em até 24 horas. O valor sai do saldo disponível no momento da solicitação.",
  ],
  [
    "Por que meu saque foi para análise?",
    "Primeiro saque, valores maiores ou sinais de risco exigem verificação adicional. Você é avisado sobre a decisão.",
  ],
  [
    "Como cancelo minha conta?",
    "Em Painel → Privacidade você baixa seus dados e solicita a exclusão da conta.",
  ],
];

export default function AjudaPage() {
  return (
    <LegalPage title="Central de ajuda">
      {FAQ.map(([q, a]) => (
        <div key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </div>
      ))}
      <p>
        Não achou o que procurava? Escreva para{" "}
        <a href="mailto:suporte@uniaoeforca.com.br">suporte@uniaoeforca.com.br</a>
        .
      </p>
    </LegalPage>
  );
}
