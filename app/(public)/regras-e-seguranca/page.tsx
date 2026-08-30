import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Regras e segurança",
  description:
    "O que pode e o que não pode em uma campanha, como funciona a moderação e as medidas que protegem o dinheiro, os dados e a confiança de todo mundo.",
};

export default function RegrasESegurancaPage() {
  return (
    <LegalPage title="Regras e segurança" updated="30/08/2026">
      <p>
        Para que a solidariedade funcione, todo mundo precisa confiar na
        plataforma — quem cria uma campanha e quem doa. Esta página reúne as
        regras de uso e as proteções que aplicamos em cada etapa.
      </p>

      <h2>1. Campanhas permitidas</h2>
      <p>
        Aceitamos campanhas com <strong>beneficiário identificável</strong> e{" "}
        <strong>finalidade clara</strong>, nas áreas de saúde, emergências,
        moradia, animais, educação, família, projetos sociais, cultura e
        esportes. A meta deve ser compatível com a necessidade descrita e a
        história deve permitir que o doador entenda para onde o dinheiro vai.
      </p>

      <h2>2. O que não é permitido</h2>
      <ul>
        <li>Fraude, informação falsa, beneficiário inexistente ou identidade de terceiros.</li>
        <li>Conteúdo ilegal, discurso de ódio, violência, assédio ou exposição indevida de pessoas.</li>
        <li>Venda de produtos ou serviços, sorteios, rifas, apostas, esquemas de investimento e &ldquo;correntes&rdquo;.</li>
        <li>Uso de imagens, textos ou marcas de terceiros sem autorização.</li>
        <li>Financiamento de atividade político-partidária ou religiosa de caráter proselitista.</li>
        <li>Coleta de dados sensíveis dos doadores além do necessário para a doação.</li>
      </ul>

      <h2>3. Verificação de identidade</h2>
      <p>
        Quem arrecada passa por verificação de identidade antes do primeiro
        saque, e novamente para valores maiores. Comparamos os dados informados
        e, quando necessário, pedimos documento e uma selfie. Os documentos
        ficam guardados em local privado, com acesso restrito à equipe de
        verificação, e são usados apenas para essa finalidade.
      </p>

      <h2>4. Moderação e análise</h2>
      <p>
        Toda campanha é revisada antes de ficar pública. Durante a operação,
        podemos:
      </p>
      <ul>
        <li>solicitar comprovação da necessidade ou do parentesco com o beneficiário;</li>
        <li>pausar novos pagamentos de uma campanha sob análise;</li>
        <li>bloquear a campanha ou a conta em caso de denúncia consistente, risco ou determinação legal;</li>
        <li>reter o saldo em análise, sem apagar o histórico, até a conclusão da apuração.</li>
      </ul>
      <p>
        Nada é excluído: bloqueios e retenções são reversíveis se a análise
        inocentar a campanha.
      </p>

      <h2>5. Como o dinheiro é protegido</h2>
      <ul>
        <li>
          Uma doação só entra no saldo depois de o pagamento ser confirmado pelo
          meio de pagamento — nunca automaticamente pelo navegador.
        </li>
        <li>
          Se um pagamento é processado mais de uma vez, o sistema reconhece e não
          duplica a doação.
        </li>
        <li>
          Todo o histórico financeiro é permanente. Qualquer ajuste fica
          registrado e justificado — nunca &ldquo;editamos saldo&rdquo;.
        </li>
        <li>
          Ao solicitar um saque, o valor é separado do saldo na hora, evitando
          que o mesmo dinheiro seja usado duas vezes.
        </li>
        <li>
          Se um repasse falha, o valor volta para o saldo disponível na mesma
          hora.
        </li>
        <li>
          Saques de valor alto passam por dupla aprovação da equipe.
        </li>
      </ul>

      <h2>6. Antifraude</h2>
      <p>
        Monitoramos sinais de risco de forma contínua: velocidade incomum de
        doações, valores fora do padrão, criação de campanha seguida de saque
        imediato e uso de múltiplas contas. Casos sinalizados entram em fila de
        análise manual antes de qualquer liberação.
      </p>

      <h2>7. Proteção de dados</h2>
      <p>
        Conexão sempre criptografada (HTTPS). Cada usuário só enxerga os próprios
        dados; informações sensíveis são criptografadas. Registramos todas as
        ações da equipe e todas as movimentações financeiras. Fazemos backups
        criptografados e conferência diária com os meios de pagamento. O
        tratamento de dados segue a LGPD — você pode exportar seus dados e pedir
        a exclusão da conta em <a href="/painel/privacidade">Painel &rarr; Privacidade</a>.
      </p>

      <h2>8. Denúncias</h2>
      <p>
        Qualquer pessoa com conta pode denunciar uma campanha pelo botão na
        própria página. Analisamos todas as denúncias e tomamos as medidas dos
        itens 4 e 5 quando necessário. Para falar com a equipe:{" "}
        <a href="mailto:suporte@uniaoeforca.com.br">suporte@uniaoeforca.com.br</a>
        . Para relatar uma vulnerabilidade de segurança:{" "}
        <a href="mailto:seguranca@uniaoeforca.com.br">
          seguranca@uniaoeforca.com.br
        </a>
        .
      </p>
    </LegalPage>
  );
}
