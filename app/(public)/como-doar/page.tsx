import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  HandHeart,
  Wallet,
  QrCode,
  CircleCheckBig,
  UserRoundCheck,
  ShieldCheck,
  EyeOff,
  ReceiptText,
  CircleHelp,
} from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Como doar",
  description:
    "Doar na União & Força é rápido, por PIX e sem precisar de conta. Passo a passo completo.",
};

export default function ComoDoarPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Como doar</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Ajudar leva menos de um minuto: é por PIX, entra na campanha
        automaticamente e não precisa de conta. Toque em cada etapa para ver o
        passo a passo completo.
      </p>

      <div className="mt-8">
        <Accordion
          items={[
            {
              icon: <Search />,
              title: "1. Encontre a campanha",
              content: (
                <>
                  <p>
                    Abra a página da campanha que você quer apoiar. Se ainda não
                    tem o link, use a busca:
                  </p>
                  <ul>
                    <li>
                      Em <Link href="/campanhas">Campanhas</Link> você vê todas as
                      campanhas ativas e pode filtrar por categoria e por estado.
                    </li>
                    <li>
                      Em <Link href="/buscar">Buscar</Link> você procura por nome,
                      cidade ou causa.
                    </li>
                  </ul>
                  <p>
                    Antes de doar, leia a história e confira o que está sendo
                    pedido. Toda campanha passou por análise antes de ficar
                    pública.
                  </p>
                </>
              ),
            },
            {
              icon: <HandHeart />,
              title: "2. Toque em “Quero ajudar”",
              content: (
                <p>
                  Na página da campanha, toque no botão{" "}
                  <strong>&ldquo;Quero ajudar&rdquo;</strong>. Você é levado para
                  a tela de contribuição. Não é preciso fazer login nem criar
                  conta.
                </p>
              ),
            },
            {
              icon: <Wallet />,
              title: "3. Escolha o valor e se identifique",
              content: (
                <>
                  <p>
                    Informe o valor que você quer doar — qualquer valor faz
                    diferença. Depois:
                  </p>
                  <ul>
                    <li>
                      escreva o seu nome (aparece na lista de apoiadores da
                      campanha), <strong>ou</strong>
                    </li>
                    <li>
                      marque a opção de <strong>doação anônima</strong> — o seu
                      nome não aparece, mas o valor continua contando no total.
                    </li>
                  </ul>
                  <p>
                    Se quiser, deixe uma mensagem de apoio para quem criou a
                    campanha.
                  </p>
                </>
              ),
            },
            {
              icon: <QrCode />,
              title: "4. Pague com PIX",
              content: (
                <>
                  <p>Na tela seguinte aparece o pagamento por PIX. Você pode:</p>
                  <ul>
                    <li>
                      escanear o <strong>QR Code</strong> com o app do seu banco,
                      ou
                    </li>
                    <li>
                      copiar o <strong>código copia-e-cola</strong> e colar na
                      opção &ldquo;PIX Copia e Cola&rdquo; do seu banco.
                    </li>
                  </ul>
                  <p>
                    Funciona com qualquer banco ou carteira digital. O valor já
                    vem preenchido — é só confirmar o pagamento no app.
                  </p>
                </>
              ),
            },
            {
              icon: <CircleCheckBig />,
              title: "5. Pronto — acompanhe",
              content: (
                <>
                  <p>
                    Assim que o pagamento é confirmado, a doação entra na campanha
                    e a tela atualiza sozinha. Você pode fechar a página e voltar
                    depois pela campanha.
                  </p>
                  <p>
                    A sua contribuição passa a contar no total arrecadado na
                    hora, e aparece na lista de apoiadores (a menos que você tenha
                    escolhido doar de forma anônima).
                  </p>
                </>
              ),
            },
            {
              icon: <UserRoundCheck />,
              title: "Preciso ter conta para doar?",
              content: (
                <p>
                  Não. Você doa por PIX sem criar conta e sem fazer login. A
                  conta só é necessária para quem vai <em>criar e gerenciar</em>{" "}
                  uma campanha ou solicitar saques.
                </p>
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
