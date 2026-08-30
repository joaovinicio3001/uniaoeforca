import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Regras de Campanhas" };

export default function PoliticaCampanhasPage() {
  return (
    <LegalPage title="Regras de Campanhas" updated="29/08/2026">
      <h2>Campanhas permitidas</h2>
      <p>
        Saúde, emergências, animais, educação, família, projetos e esportes, com
        beneficiário identificável e finalidade clara.
      </p>
      <h2>Não é permitido</h2>
      <ul>
        <li>Fraude, informação falsa ou beneficiário inexistente.</li>
        <li>Conteúdo ilegal, discurso de ódio, violência ou assédio.</li>
        <li>
          Venda de produtos/serviços, apostas, esquemas financeiros e
          &ldquo;correntes&rdquo;.
        </li>
        <li>Uso de imagens, textos ou marcas de terceiros sem autorização.</li>
        <li>Coleta de dados sensíveis de doadores fora do necessário.</li>
      </ul>
      <h2>Moderação</h2>
      <p>
        Toda campanha é revisada antes de ficar pública. Podemos solicitar
        comprovação, pausar novos pagamentos, bloquear a campanha ou reter o
        saldo em caso de denúncia, risco ou determinação legal — sem apagar o
        histórico.
      </p>
      <h2>Denúncias</h2>
      <p>
        Qualquer usuário autenticado pode denunciar uma campanha pelo botão na
        própria página. Analisamos todas as denúncias.
      </p>
    </LegalPage>
  );
}
