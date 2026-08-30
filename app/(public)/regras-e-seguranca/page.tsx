import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleCheckBig,
  Ban,
  Coins,
  BadgeCheck,
  Gavel,
  Landmark,
  ScanEye,
  FileLock2,
  Flag,
} from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { computeFees } from "@/lib/payments/fees";
import { formatBRL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Regras e segurança",
  description:
    "O que pode e o que não pode em uma campanha, os custos da plataforma, a moderação e as proteções que garantem a confiança de todo mundo.",
};

export const revalidate = 600;

export default async function RegrasESegurancaPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: rule } = await supabase
    .from("fee_rules")
    .select("*")
    .lte("active_from", now)
    .or(`active_to.is.null,active_to.gt.${now}`)
    .order("active_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pct = rule ? rule.percentage_bps / 100 : 5;
  const withdrawalFee = rule?.withdrawal_fee_cents ?? 0;
  const env = serverEnv();
  const ex =
    rule &&
    (() => {
      try {
        return computeFees(10000, rule, {
          bps: env.PUSHINPAY_FEE_BPS,
          minCents: env.PUSHINPAY_FEE_MIN_CENTS,
        });
      } catch {
        return null;
      }
    })();

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Regras e segurança</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Para que a solidariedade funcione, todo mundo precisa confiar na
        plataforma — quem cria uma campanha e quem doa. Toque em cada tópico para
        ver as regras, os custos e as proteções.
      </p>

      <div className="mt-8">
        <Accordion
          items={[
            {
              icon: <CircleCheckBig />,
              title: "Campanhas permitidas",
              content: (
                <p>
                  Aceitamos campanhas com <strong>beneficiário identificável</strong>{" "}
                  e <strong>finalidade clara</strong>, nas áreas de saúde,
                  emergências, moradia, animais, educação, família, projetos
                  sociais, cultura e esportes. A meta deve ser compatível com a
                  necessidade descrita, e a história deve permitir que o doador
                  entenda para onde o dinheiro vai.
                </p>
              ),
            },
            {
              icon: <Ban />,
              title: "O que não é permitido",
              content: (
                <ul>
                  <li>Fraude, informação falsa, beneficiário inexistente ou identidade de terceiros.</li>
                  <li>Conteúdo ilegal, discurso de ódio, violência, assédio ou exposição indevida de pessoas.</li>
                  <li>Venda de produtos ou serviços, sorteios, rifas, apostas, esquemas de investimento e &ldquo;correntes&rdquo;.</li>
                  <li>Uso de imagens, textos ou marcas de terceiros sem autorização.</li>
                  <li>Financiamento de atividade político-partidária ou religiosa de caráter proselitista.</li>
                  <li>Coleta de dados sensíveis dos doadores além do necessário para a doação.</li>
                </ul>
              ),
            },
            {
              icon: <Coins />,
              title: "Custos",
              content: (
                <>
                  <p>
                    <strong>Criar, editar e divulgar uma campanha é 100%
                    gratuito.</strong> Não há mensalidade, taxa de adesão nem
                    cobrança por campanha. Você só tem custo quando dinheiro entra
                    ou sai.
                  </p>
                  <ul>
                    <li>
                      <strong>Taxa da plataforma:</strong>{" "}
                      {pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
                      sobre cada doação confirmada. Cobre infraestrutura, suporte,
                      verificação de identidade, monitoramento antifraude e
                      conciliação diária.
                    </li>
                    <li>
                      <strong>Custo do PIX ao receber:</strong> tarifa fixa de{" "}
                      {formatBRL(env.PUSHINPAY_FEE_MIN_CENTS)} por doação, cobrada
                      pelo meio de pagamento e repassada sem margem.
                    </li>
                    <li>
                      <strong>Custo ao sacar:</strong>{" "}
                      {withdrawalFee > 0
                        ? `taxa de saque de ${formatBRL(withdrawalFee)} por solicitação, mais `
                        : ""}
                      o custo do PIX no envio (3% do valor, com mínimo de{" "}
                      {formatBRL(77)}). Os valores aparecem antes de você
                      confirmar.
                    </li>
                  </ul>
                  {ex && (
                    <p>
                      <strong>Exemplo:</strong> numa doação de{" "}
                      {formatBRL(ex.grossCents)}, a campanha recebe{" "}
                      {formatBRL(ex.netCents)} ({formatBRL(ex.platformFeeCents)} de
                      taxa da plataforma e {formatBRL(ex.providerFeeCents)} de
                      custo do PIX).
                    </p>
                  )}
                  <p>
                    O detalhamento exato fica registrado em cada doação. Não
                    cobramos nada por fora e não há taxa de inatividade.
                  </p>
                </>
              ),
            },
            {
              icon: <BadgeCheck />,
              title: "Verificação de identidade",
              content: (
                <p>
                  Quem arrecada passa por verificação de identidade antes do
                  primeiro saque, e novamente para valores maiores. Comparamos os
                  dados informados e, quando necessário, pedimos documento e uma
                  selfie. Os documentos ficam guardados em local privado, com
                  acesso restrito à equipe de verificação, e são usados apenas
                  para essa finalidade.
                </p>
              ),
            },
            {
              icon: <Gavel />,
              title: "Moderação e análise",
              content: (
                <>
                  <p>Toda campanha é revisada antes de ficar pública. Durante a operação, podemos:</p>
                  <ul>
                    <li>solicitar comprovação da necessidade ou do vínculo com o beneficiário;</li>
                    <li>pausar novos pagamentos de uma campanha sob análise;</li>
                    <li>bloquear a campanha ou a conta em caso de denúncia consistente, risco ou determinação legal;</li>
                    <li>reter o saldo em análise, sem apagar o histórico, até a conclusão da apuração.</li>
                  </ul>
                  <p>
                    Nada é excluído: bloqueios e retenções são reversíveis se a
                    análise inocentar a campanha.
                  </p>
                </>
              ),
            },
            {
              icon: <Landmark />,
              title: "Como o dinheiro é protegido",
              content: (
                <ul>
                  <li>Uma doação só entra no saldo depois de o pagamento ser confirmado pelo meio de pagamento — nunca automaticamente pelo navegador.</li>
                  <li>Se um pagamento é processado mais de uma vez, o sistema reconhece e não duplica a doação.</li>
                  <li>Todo o histórico financeiro é permanente. Qualquer ajuste fica registrado e justificado — nunca &ldquo;editamos saldo&rdquo;.</li>
                  <li>Ao solicitar um saque, o valor é separado do saldo na hora, evitando que o mesmo dinheiro seja usado duas vezes.</li>
                  <li>Se um repasse falha, o valor volta para o saldo disponível na mesma hora.</li>
                  <li>Saques de valor alto passam por dupla aprovação da equipe.</li>
                </ul>
              ),
            },
            {
              icon: <ScanEye />,
              title: "Antifraude",
              content: (
                <p>
                  Monitoramos sinais de risco de forma contínua: velocidade
                  incomum de doações, valores fora do padrão, criação de campanha
                  seguida de saque imediato e uso de múltiplas contas. Casos
                  sinalizados entram em fila de análise manual antes de qualquer
                  liberação.
                </p>
              ),
            },
            {
              icon: <FileLock2 />,
              title: "Proteção de dados",
              content: (
                <p>
                  Conexão sempre criptografada (HTTPS). Cada usuário só enxerga os
                  próprios dados; informações sensíveis são criptografadas.
                  Registramos todas as ações da equipe e todas as movimentações
                  financeiras. Fazemos backups criptografados e conferência diária
                  com os meios de pagamento. O tratamento de dados segue a LGPD —
                  você pode exportar seus dados e pedir a exclusão da conta em{" "}
                  <Link href="/painel/privacidade">Painel &rarr; Privacidade</Link>
                  .
                </p>
              ),
            },
            {
              icon: <Flag />,
              title: "Denúncias",
              content: (
                <p>
                  Qualquer pessoa com conta pode denunciar uma campanha pelo botão
                  na própria página. Analisamos todas as denúncias e tomamos as
                  medidas de moderação quando necessário. Para falar com a equipe:{" "}
                  <a href="mailto:suporte@uniaoeforca.com.br">
                    suporte@uniaoeforca.com.br
                  </a>
                  . Para relatar uma vulnerabilidade de segurança:{" "}
                  <a href="mailto:seguranca@uniaoeforca.com.br">
                    seguranca@uniaoeforca.com.br
                  </a>
                  .
                </p>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
