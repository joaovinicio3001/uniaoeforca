import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a União & Força trata dados pessoais, base legal, retenção e direitos do titular (LGPD).",
};

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de Privacidade" updated="29/08/2026">
      <p>
        Esta política descreve como a plataforma <strong>União &amp; Força</strong>{" "}
        trata dados pessoais, em conformidade com a Lei nº 13.709/2018 (LGPD).
        Este texto é um modelo operacional e deve ser revisado por assessoria
        jurídica antes do lançamento.
      </p>

      <h2>1. Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>Cadastro:</strong> nome, CPF, data de nascimento, e-mail,
          telefone e, quando necessário, endereço.
        </li>
        <li>
          <strong>Campanhas:</strong> textos, imagens, localização e dados do
          beneficiário informados por quem cria a campanha.
        </li>
        <li>
          <strong>Financeiro:</strong> valor das doações e saques, chave PIX
          (armazenada de forma cifrada), identificadores de transação dos
          provedores de pagamento.
        </li>
        <li>
          <strong>Verificação (KYC):</strong> documento de identidade e selfie,
          quando exigido, guardados em armazenamento privado com acesso restrito.
        </li>
        <li>
          <strong>Técnicos:</strong> endereço IP e registros de acesso, usados
          para segurança e prevenção a fraude.
        </li>
      </ul>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Executar o serviço: criar conta, publicar campanha, processar doações e saques.</li>
        <li>Cumprir obrigações legais e regulatórias (prevenção à fraude, PLD/FT, obrigações fiscais).</li>
        <li>Segurança da plataforma e das contas.</li>
        <li>Comunicações transacionais (confirmações, avisos de segurança).</li>
        <li>Marketing — apenas com consentimento específico, que pode ser retirado a qualquer momento.</li>
      </ul>

      <h2>3. Base legal</h2>
      <p>
        Tratamos dados com base em: execução de contrato, cumprimento de
        obrigação legal/regulatória, legítimo interesse (segurança e prevenção a
        fraude) e consentimento (marketing).
      </p>

      <h2>4. Compartilhamento</h2>
      <p>
        Compartilhamos dados apenas com operadores necessários à prestação do
        serviço, sob contrato: provedor de banco de dados e autenticação
        (Supabase), CDN de imagens (Bunny.net), provedor de PIX de entrada
        (Pushin Pay), provedor de PIX de saída (GGPix), e-mail transacional
        (Resend). Não vendemos dados pessoais.
      </p>

      <h2>5. Retenção</h2>
      <p>
        Dados cadastrais e financeiros são mantidos pelo prazo exigido pela
        legislação aplicável (incluindo prazos fiscais e de prevenção a fraude).
        Após esse prazo, os dados são anonimizados ou eliminados. Documentos de
        KYC são mantidos apenas pelo tempo necessário à verificação e às
        obrigações legais.
      </p>

      <h2>6. Direitos do titular</h2>
      <p>
        Você pode confirmar a existência de tratamento, acessar, corrigir,
        solicitar portabilidade, anonimização ou eliminação, e revogar
        consentimento. Usuários autenticados podem baixar seus dados e solicitar
        exclusão em <strong>Painel → Privacidade</strong>. Outras solicitações:{" "}
        <a href="mailto:privacidade@uniaoeforca.com.br">
          privacidade@uniaoeforca.com.br
        </a>
        .
      </p>

      <h2>7. Segurança</h2>
      <p>
        Adotamos HTTPS obrigatório, isolamento de dados por usuário no banco
        (RLS), cifra de dados sensíveis em repouso, MFA para a administração,
        trilha de auditoria e backups criptografados. Nenhum sistema é
        infalível; incidentes relevantes são comunicados conforme a LGPD.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Usamos apenas cookies estritamente necessários (sessão e segurança). Não
        usamos cookies de rastreamento de terceiros por padrão.
      </p>

      <h2>9. Encarregado (DPO)</h2>
      <p>
        Contato do encarregado pelo tratamento de dados:{" "}
        <a href="mailto:dpo@uniaoeforca.com.br">dpo@uniaoeforca.com.br</a>.
      </p>
    </LegalPage>
  );
}
