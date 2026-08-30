import type { Metadata } from "next";
import Link from "next/link";
import {
  UserPlus,
  BadgeCheck,
  PenLine,
  Images,
  Send,
  ShieldCheck,
  Share2,
  LineChart,
  KeyRound,
  Banknote,
} from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Como criar uma campanha",
  description:
    "Passo a passo completo para criar a sua campanha na União & Força: da conta ao primeiro saque, com dicas para arrecadar mais.",
};

export default function ComoFuncionaPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Como criar uma campanha</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Criar é gratuito e leva poucos minutos. Toque em cada etapa para ver o
        passo a passo completo, do cadastro ao dinheiro na sua conta.
      </p>

      <div className="mt-8">
        <Accordion
          items={[
            {
              icon: <UserPlus />,
              title: "1. Crie a sua conta",
              content: (
                <>
                  <p>
                    Clique em <strong>Criar conta</strong>, informe nome, e-mail
                    e uma senha forte (8 caracteres ou mais, com maiúsculas,
                    minúsculas, números e símbolos). Você recebe um e-mail de
                    confirmação — clique no link para ativar a conta e entrar no
                    painel.
                  </p>
                  <p>
                    Não é preciso ter conta para <em>doar</em>, só para criar
                    campanhas e sacar.
                  </p>
                </>
              ),
            },
            {
              icon: <BadgeCheck />,
              title: "2. Confirme a sua identidade",
              content: (
                <>
                  <p>
                    Antes do primeiro saque, você precisa passar pela verificação
                    de identidade. No painel, vá em{" "}
                    <strong>Verificação de identidade</strong> e informe nome
                    completo e data de nascimento exatamente como no documento.
                    Para valores maiores, pedimos também uma foto do documento e
                    uma selfie.
                  </p>
                  <p>
                    Você pode criar e publicar a campanha antes disso — a
                    verificação só é obrigatória na hora de retirar o dinheiro.
                    Fazer logo evita atrasos depois.
                  </p>
                </>
              ),
            },
            {
              icon: <PenLine />,
              title: "3. Monte o rascunho da campanha",
              content: (
                <>
                  <p>
                    No painel, clique em <strong>Criar campanha</strong>. Você
                    preenche:
                  </p>
                  <ul>
                    <li><strong>Título</strong> — curto e direto, dizendo quem é ajudado e para quê. Ex.: <em>&ldquo;Ajude o tratamento do João&rdquo;</em>.</li>
                    <li><strong>Categoria</strong> — saúde, emergências, animais, educação, família, projetos, etc.</li>
                    <li><strong>Meta (R$)</strong> — o valor que você precisa arrecadar. Seja realista e explique na história como chegou nesse número.</li>
                    <li><strong>Resumo</strong> — uma frase que aparece nos cards e quando o link é compartilhado.</li>
                    <li><strong>História</strong> — o texto completo. Conte o que aconteceu, quem é a pessoa, para que serve o dinheiro e o que muda com a ajuda. Uma linha em branco separa os parágrafos.</li>
                    <li><strong>Cidade e UF</strong> — onde a campanha acontece.</li>
                  </ul>
                  <p>
                    O rascunho é salvo na sua conta. Dá para editar quantas vezes
                    quiser antes de enviar para análise.
                  </p>
                  <p>
                    <strong>Dica para a história:</strong> comece pelo fato
                    principal, use parágrafos curtos, seja específico com valores
                    e prazos, e diga claramente o que a pessoa pode fazer para
                    ajudar (doar e compartilhar).
                  </p>
                </>
              ),
            },
            {
              icon: <Images />,
              title: "4. Adicione fotos",
              content: (
                <>
                  <p>
                    Campanhas com foto arrecadam muito mais. Envie imagens reais
                    e nítidas — da pessoa, do animal, do local ou da situação. A
                    primeira imagem vira a capa (a que aparece nos cards e no
                    compartilhamento).
                  </p>
                  <p>
                    Use fotos que você tem direito de usar. Não publique imagens
                    de terceiros sem autorização.
                  </p>
                </>
              ),
            },
            {
              icon: <Send />,
              title: "5. Revise e envie para análise",
              content: (
                <p>
                  Confira título, meta, história e fotos. Quando estiver pronto,
                  clique em <strong>Enviar para análise</strong>. A campanha sai
                  do estado de rascunho e entra na fila de moderação.
                </p>
              ),
            },
            {
              icon: <ShieldCheck />,
              title: "6. Aprovação",
              content: (
                <>
                  <p>
                    Toda campanha é revisada por uma pessoa antes de ficar
                    pública. Verificamos se a finalidade é clara, se o
                    beneficiário é identificável e se o conteúdo segue as{" "}
                    <Link href="/regras-e-seguranca">regras da plataforma</Link>.
                    Podemos pedir uma comprovação.
                  </p>
                  <p>
                    Se algo precisar de ajuste, você é avisado e a campanha volta
                    para rascunho com a orientação do que corrigir. Aprovada, ela
                    fica no ar com um link público para compartilhar.
                  </p>
                </>
              ),
            },
            {
              icon: <Share2 />,
              title: "7. Divulgue",
              content: (
                <>
                  <p>A divulgação é o que faz a campanha andar. Assim que for aprovada:</p>
                  <ul>
                    <li>Compartilhe o link no WhatsApp, Instagram, Facebook e grupos de família.</li>
                    <li>Peça para amigos próximos compartilharem também — o alcance multiplica.</li>
                    <li>Publique <strong>atualizações</strong> pelo painel: novidades, o valor já arrecadado, agradecimentos.</li>
                    <li>Fixe o link na bio das suas redes.</li>
                  </ul>
                </>
              ),
            },
            {
              icon: <LineChart />,
              title: "8. Acompanhe as doações",
              content: (
                <>
                  <p>
                    No painel você vê, em tempo real: cada doação recebida, o
                    total arrecadado, o número de apoiadores e quanto já está{" "}
                    <strong>disponível para saque</strong>. Cada doação por PIX
                    entra automaticamente assim que o pagamento é confirmado.
                  </p>
                  <p>
                    O <strong>extrato</strong> mostra a origem de cada valor e o
                    detalhamento das taxas — veja em{" "}
                    <Link href="/regras-e-seguranca">Regras e segurança</Link>.
                  </p>
                </>
              ),
            },
            {
              icon: <KeyRound />,
              title: "9. Cadastre a sua chave PIX",
              content: (
                <p>
                  Em <strong>Chaves PIX</strong>, cadastre a chave que vai
                  receber os saques (CPF, e-mail, telefone ou chave aleatória).
                  Confira com atenção — o repasse é feito para a chave informada.
                </p>
              ),
            },
            {
              icon: <Banknote />,
              title: "10. Solicite o saque",
              content: (
                <>
                  <p>
                    Quando houver saldo disponível, clique em{" "}
                    <strong>Solicitar saque</strong>, escolha a chave PIX e o
                    valor, e confirme com a sua senha. O valor sai do saldo na
                    hora e o pedido passa por uma verificação de segurança. Não há
                    prazo mínimo de campanha para sacar, e você pode sacar quantas
                    vezes quiser.
                  </p>
                  <p>
                    Os custos do saque aparecem antes de você confirmar. Detalhes
                    em <Link href="/regras-e-seguranca">Regras e segurança</Link>.
                  </p>
                </>
              ),
            },
          ]}
        />
      </div>

      <div className="mt-10 rounded-2xl border bg-brand-surface p-6">
        <h2 className="text-lg font-bold">E se eu quiser só doar?</h2>
        <p className="mt-2 text-muted-foreground">
          Não precisa de conta. Abra a campanha, toque em &ldquo;Quero
          ajudar&rdquo;, escolha o valor e pague por PIX. A doação entra
          automaticamente assim que o pagamento é confirmado. Veja o passo a
          passo em <Link href="/como-doar" className="font-medium text-primary underline">Como doar</Link>.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/cadastro">Criar minha campanha</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/campanhas">Ver campanhas</Link>
        </Button>
      </div>
    </div>
  );
}
