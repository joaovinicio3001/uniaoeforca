import type { Metadata } from "next";
import Link from "next/link";
import {
  UserRoundCheck,
  Clock,
  Wallet,
  SearchCheck,
  UserRoundX,
  LifeBuoy,
} from "lucide-react";

import { Accordion } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Central de Ajuda",
  description:
    "Respostas rápidas sobre doações, campanhas, pagamentos e saques na União & Força.",
};

export default function AjudaPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Central de Ajuda</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Encontre respostas rápidas para as principais dúvidas sobre doações,
        campanhas, pagamentos e saques.
      </p>

      <div className="mt-8">
        <Accordion
          items={[
            {
              icon: <UserRoundCheck />,
              title: "Preciso criar uma conta para doar?",
              content: (
                <>
                  <p>
                    Não. Você pode fazer uma doação via PIX sem precisar criar
                    uma conta ou fazer login.
                  </p>
                  <p>
                    A conta é necessária apenas para criar e gerenciar campanhas
                    ou solicitar saques.
                  </p>
                </>
              ),
            },
            {
              icon: <Clock />,
              title: "Quando a doação aparece na campanha?",
              content: (
                <>
                  <p>
                    Assim que o pagamento via PIX é confirmado, a doação é
                    registrada automaticamente na campanha.
                  </p>
                  <p>
                    A página é atualizada após a confirmação, permitindo
                    acompanhar as contribuições em tempo real.
                  </p>
                </>
              ),
            },
            {
              icon: <Wallet />,
              title: "Quanto tempo leva para receber um saque?",
              content: (
                <>
                  <p>
                    Após solicitar o saque, ele passa por uma rápida verificação
                    de segurança.
                  </p>
                  <p>
                    Em até 1 hora após a solicitação, o valor estará disponível
                    para saque, desde que todas as informações estejam corretas.
                  </p>
                  <p>
                    Você pode acompanhar o status da solicitação diretamente pelo
                    seu painel.
                  </p>
                </>
              ),
            },
            {
              icon: <SearchCheck />,
              title: "Por que meu saque está em análise?",
              content: (
                <>
                  <p>
                    Algumas solicitações podem precisar de uma verificação
                    adicional para manter a plataforma segura.
                  </p>
                  <p>
                    Isso pode acontecer, por exemplo, no primeiro saque, quando
                    for necessário confirmar alguma informação ou realizar uma
                    verificação de segurança.
                  </p>
                  <p>
                    Você poderá acompanhar o andamento diretamente pelo seu
                    painel.
                  </p>
                </>
              ),
            },
            {
              icon: <UserRoundX />,
              title: "Como excluir minha conta?",
              content: (
                <>
                  <p>
                    Acesse Painel &rarr; Privacidade para solicitar a exclusão da
                    sua conta.
                  </p>
                  <p>
                    Antes de excluir, você também poderá solicitar uma cópia dos
                    seus dados.
                  </p>
                </>
              ),
            },
          ]}
        />
      </div>

      <div className="mt-10 rounded-2xl border bg-brand-surface p-6">
        <h2 className="text-lg font-bold">Ainda precisa de ajuda?</h2>
        <p className="mt-2 text-muted-foreground">
          Se você tem conta, abra um chamado e acompanhe a resposta da equipe
          direto no painel. Também respondemos pelo e-mail{" "}
          <a
            href="mailto:suporte@uniaoeforca.com.br"
            className="font-medium text-primary underline"
          >
            suporte@uniaoeforca.com.br
          </a>
          .
        </p>
        <Link
          href="/painel/suporte/novo"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <LifeBuoy className="size-4" /> Abrir um chamado
        </Link>
      </div>
    </div>
  );
}
