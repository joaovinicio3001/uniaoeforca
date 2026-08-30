import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Central de Ajuda",
  description:
    "Respostas rápidas sobre doações, campanhas, pagamentos e saques na União & Força.",
};

const FAQ: { q: string; a: string[] }[] = [
  {
    q: "Preciso criar uma conta para doar?",
    a: [
      "Não. Você pode fazer uma doação via PIX sem precisar criar uma conta ou fazer login.",
      "A conta é necessária apenas para criar e gerenciar campanhas ou solicitar saques.",
    ],
  },
  {
    q: "Quando a doação aparece na campanha?",
    a: [
      "Assim que o pagamento via PIX é confirmado, a doação é registrada automaticamente na campanha.",
      "A página é atualizada após a confirmação, permitindo acompanhar as contribuições em tempo real.",
    ],
  },
  {
    q: "Quanto tempo leva para receber um saque?",
    a: [
      "Após solicitar o saque, ele passa por uma rápida verificação de segurança.",
      "Em até 1 hora após a solicitação, o valor estará disponível para saque, desde que todas as informações estejam corretas.",
      "Você pode acompanhar o status da solicitação diretamente pelo seu painel.",
    ],
  },
  {
    q: "Por que meu saque está em análise?",
    a: [
      "Algumas solicitações podem precisar de uma verificação adicional para manter a plataforma segura.",
      "Isso pode acontecer, por exemplo, no primeiro saque, quando for necessário confirmar alguma informação ou realizar uma verificação de segurança.",
      "Você poderá acompanhar o andamento diretamente pelo seu painel.",
    ],
  },
  {
    q: "Como excluir minha conta?",
    a: [
      "Acesse Painel → Privacidade para solicitar a exclusão da sua conta.",
      "Antes de excluir, você também poderá solicitar uma cópia dos seus dados.",
    ],
  },
];

export default function AjudaPage() {
  return (
    <LegalPage title="Central de Ajuda">
      <p>
        Encontre respostas rápidas para as principais dúvidas sobre doações,
        campanhas, pagamentos e saques.
      </p>

      {FAQ.map(({ q, a }) => (
        <div key={q}>
          <h2>{q}</h2>
          {a.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ))}

      <h2>Ainda precisa de ajuda?</h2>
      <p>
        Se não encontrou a resposta que procurava, entre em contato com nossa
        equipe pelo e-mail{" "}
        <a href="mailto:suporte@uniaoeforca.com.br">suporte@uniaoeforca.com.br</a>
        .
      </p>
      <p>Responderemos assim que possível.</p>
    </LegalPage>
  );
}
