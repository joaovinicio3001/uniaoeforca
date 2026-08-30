import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Como criar uma campanha",
  description:
    "Passo a passo completo para criar a sua campanha na União & Força: da conta ao primeiro saque, com dicas para arrecadar mais.",
};

export default function ComoFuncionaPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Como criar uma campanha</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Criar é gratuito e leva poucos minutos. Abaixo está o caminho completo,
        do cadastro ao dinheiro na sua conta, com dicas para a sua campanha
        arrecadar mais.
      </p>

      <div className="mt-8 space-y-10">
        <Step n={1} title="Crie a sua conta">
          <p>
            Clique em <strong>Criar conta</strong>, informe nome, e-mail e uma
            senha forte (8 caracteres ou mais, com maiúsculas, minúsculas,
            números e símbolos). Você recebe um e-mail de confirmação — clique no
            link para ativar a conta e entrar no painel.
          </p>
          <p>
            Não é preciso ter conta para <em>doar</em>, só para criar campanhas e
            sacar.
          </p>
        </Step>

        <Step n={2} title="Confirme a sua identidade">
          <p>
            Antes do primeiro saque, você precisa passar pela verificação de
            identidade. No painel, vá em <strong>Verificação de identidade</strong>{" "}
            e informe nome completo e data de nascimento exatamente como no
            documento. Para valores maiores, pedimos também uma foto do documento
            e uma selfie.
          </p>
          <p>
            Você pode criar e publicar a campanha antes disso — a verificação só
            é obrigatória na hora de retirar o dinheiro. Fazer logo evita
            atrasos depois.
          </p>
        </Step>

        <Step n={3} title="Monte o rascunho da campanha">
          <p>
            No painel, clique em <strong>Criar campanha</strong>. Você preenche:
          </p>
          <ul>
            <li>
              <strong>Título</strong> — curto e direto, dizendo quem é ajudado e
              para quê. Ex.: <em>&ldquo;Ajude o tratamento do João&rdquo;</em>.
            </li>
            <li>
              <strong>Categoria</strong> — saúde, emergências, animais, educação,
              família, projetos, etc. Ajuda as pessoas a encontrarem a sua
              campanha.
            </li>
            <li>
              <strong>Meta (R$)</strong> — o valor que você precisa arrecadar.
              Seja realista e, se possível, explique na história como chegou
              nesse número (orçamento, nota, laudo).
            </li>
            <li>
              <strong>Resumo</strong> — uma frase que aparece nos cards e quando
              o link é compartilhado. Pense nela como a &ldquo;chamada&rdquo; da
              campanha.
            </li>
            <li>
              <strong>História</strong> — o texto completo. Conte o que
              aconteceu, quem é a pessoa, para que serve o dinheiro e o que muda
              com a ajuda. Uma linha em branco separa os parágrafos.
            </li>
            <li>
              <strong>Cidade e UF</strong> — onde a campanha acontece. Permite
              que as pessoas filtrem por região.
            </li>
          </ul>
          <p>
            O rascunho é salvo na sua conta. Você pode voltar e editar quantas
            vezes quiser antes de enviar para análise.
          </p>
          <Tip>
            <strong>Como escrever uma boa história:</strong> comece pelo fato
            principal, use parágrafos curtos, seja específico com valores e
            prazos, e diga claramente o que a pessoa pode fazer para ajudar
            (doar e compartilhar). Evite dados sensíveis desnecessários.
          </Tip>
        </Step>

        <Step n={4} title="Adicione fotos">
          <p>
            Campanhas com foto arrecadam muito mais. Envie imagens reais e
            nítidas — da pessoa, do animal, do local ou da situação. A primeira
            imagem vira a capa (a que aparece nos cards e no compartilhamento).
          </p>
          <p>
            Use fotos que você tem direito de usar. Não publique imagens de
            terceiros sem autorização.
          </p>
        </Step>

        <Step n={5} title="Revise e envie para análise">
          <p>
            Confira título, meta, história e fotos. Quando estiver pronto,
            clique em <strong>Enviar para análise</strong>. A campanha sai do
            estado de rascunho e entra na fila de moderação.
          </p>
        </Step>

        <Step n={6} title="Aprovação">
          <p>
            Toda campanha é revisada por uma pessoa antes de ficar pública. Nós
            verificamos se a finalidade é clara, se o beneficiário é
            identificável e se o conteúdo segue as{" "}
            <Link href="/regras-e-seguranca">regras da plataforma</Link>. Podemos
            pedir uma comprovação (orçamento, laudo, vínculo com o beneficiário).
          </p>
          <p>
            Se algo precisar de ajuste, você é avisado e a campanha volta para
            rascunho com a orientação do que corrigir. Aprovada, ela fica no ar
            com um link público para compartilhar.
          </p>
        </Step>

        <Step n={7} title="Divulgue">
          <p>
            A divulgação é o que faz a campanha andar. Assim que for aprovada:
          </p>
          <ul>
            <li>Compartilhe o link no WhatsApp, Instagram, Facebook e grupos de família.</li>
            <li>Peça para amigos próximos compartilharem também — o alcance multiplica.</li>
            <li>Publique <strong>atualizações</strong> pelo painel: novidades sobre o tratamento, o valor já arrecadado, agradecimentos. Isso mantém as pessoas engajadas e traz novas doações.</li>
            <li>Fixe o link na bio das suas redes.</li>
          </ul>
        </Step>

        <Step n={8} title="Acompanhe as doações">
          <p>
            No painel você vê, em tempo real: cada doação recebida, o total
            arrecadado, o número de apoiadores e quanto já está{" "}
            <strong>disponível para saque</strong>. Cada doação por PIX entra
            automaticamente assim que o pagamento é confirmado.
          </p>
          <p>
            O <strong>extrato</strong> mostra a origem de cada valor e o
            detalhamento das taxas — veja os{" "}
            <Link href="/custos">custos</Link>.
          </p>
        </Step>

        <Step n={9} title="Cadastre a sua chave PIX">
          <p>
            Em <strong>Chaves PIX</strong>, cadastre a chave que vai receber os
            saques (CPF, e-mail, telefone ou chave aleatória). Confira com
            atenção — o repasse é feito para a chave informada.
          </p>
        </Step>

        <Step n={10} title="Solicite o saque">
          <p>
            Quando houver saldo disponível, clique em{" "}
            <strong>Solicitar saque</strong>, escolha a chave PIX e o valor, e
            confirme com a sua senha. O valor sai do saldo na hora e o pedido
            entra em análise. O repasse costuma cair em até 24 horas. Não há
            prazo mínimo de campanha para sacar, e você pode sacar quantas vezes
            quiser.
          </p>
          <p>
            Os custos do saque aparecem antes de você confirmar. Detalhes em{" "}
            <Link href="/custos">custos</Link>.
          </p>
        </Step>
      </div>

      {/* Doar */}
      <div className="mt-14 rounded-xl border bg-brand-surface p-6">
        <h2 className="text-xl font-bold">E se eu quiser só doar?</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-6 text-muted-foreground">
          <li>Abra a página da campanha e clique em &ldquo;Quero ajudar&rdquo;.</li>
          <li>Escolha o valor e informe seu nome (ou doe anonimamente). Não precisa ter conta.</li>
          <li>Pague com PIX pelo QR Code ou pelo copia-e-cola.</li>
          <li>A doação entra na campanha automaticamente assim que o pagamento é confirmado. A tela atualiza sozinha.</li>
        </ol>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
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

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 pl-11 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_li]:ml-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      {children}
    </div>
  );
}
