import type { Metadata } from "next";
import Link from "next/link";
import {
  UserRoundCheck,
  QrCode,
  ShieldCheck,
  ReceiptText,
  EyeOff,
  CircleHelp,
} from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Como doar",
  description:
    "Doar na União & Força é rápido, por PIX e sem precisar de conta. Veja como funciona.",
};

export default function ComoDoarPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Como doar</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Ajudar leva menos de um minuto: é por PIX, entra na campanha
        automaticamente e não precisa de conta. Toque em cada tópico para ver os
        detalhes.
      </p>

      <div className="mt-8">
        <Accordion
          items={[
            {
              icon: <UserRoundCheck />,
              title: "Preciso ter conta para doar?",
              content: (
                <>
                  <p>
                    Não. Você pode doar por PIX sem criar conta e sem fazer
                    login. A conta só é necessária para quem vai{" "}
                    <em>criar e gerenciar</em> uma campanha ou solicitar saques.
                  </p>
                </>
              ),
            },
            {
              icon: <QrCode />,
              title: "Passo a passo da doação",
              content: (
                <ol className="list-decimal space-y-2 pl-6">
                  <li>Abra a página da campanha que você quer apoiar.</li>
                  <li>
                    Toque em <strong>&ldquo;Quero ajudar&rdquo;</strong>.
                  </li>
                  <li>
                    Escolha o valor e informe o seu nome — ou marque para doar de
                    forma anônima.
                  </li>
                  <li>
                    Pague com PIX pelo <strong>QR Code</strong> ou pelo{" "}
                    <strong>código copia-e-cola</strong>, no app do seu banco.
                  </li>
                  <li>
                    Pronto. Assim que o pagamento é confirmado, a doação entra na
                    campanha e a tela atualiza sozinha.
                  </li>
                </ol>
              ),
            },
            {
              icon: <ShieldCheck />,
              title: "É seguro doar?",
              content: (
                <>
                  <p>
                    Sim. A doação só é registrada depois que o pagamento é
                    confirmado de verdade — nunca automaticamente pelo navegador.
                    Cada contribuição fica registrada no extrato da campanha, com
                    data e valor.
                  </p>
                  <p>
                    Toda campanha passa por análise antes de ficar pública e
                    continua sendo monitorada. Veja mais em{" "}
                    <Link href="/regras-e-seguranca">Regras e segurança</Link>.
                  </p>
                </>
              ),
            },
            {
              icon: <ReceiptText />,
              title: "Recebo comprovante?",
              content: (
                <p>
                  A própria tela de pagamento confirma quando a doação é
                  registrada. O comprovante do PIX você também tem no app do seu
                  banco. Doações não anônimas aparecem na lista de apoiadores da
                  campanha.
                </p>
              ),
            },
            {
              icon: <EyeOff />,
              title: "Posso doar anonimamente?",
              content: (
                <p>
                  Pode. Na hora de doar, marque a opção de doação anônima — o seu
                  nome não aparece na campanha. O valor continua sendo
                  contabilizado normalmente no total arrecadado.
                </p>
              ),
            },
            {
              icon: <CircleHelp />,
              title: "Doei e não apareceu na campanha",
              content: (
                <>
                  <p>
                    Abrir a tela do pagamento força uma nova conferência com o
                    banco. Se o PIX foi pago, a doação aparece em instantes.
                  </p>
                  <p>
                    Se o pagamento não chegou a ser concluído, nenhum valor é
                    cobrado — é só tentar de novo. Persistindo a dúvida, fale com
                    a gente em{" "}
                    <a href="mailto:suporte@uniaoeforca.com.br">
                      suporte@uniaoeforca.com.br
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/campanhas">Encontrar uma campanha</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/ajuda">Central de ajuda</Link>
        </Button>
      </div>
    </div>
  );
}
