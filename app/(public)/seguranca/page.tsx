import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Segurança",
  description: "Como a União & Força protege o seu dinheiro, a sua conta e os seus dados.",
};

export default function SegurancaPage() {
  return (
    <LegalPage title="Segurança">
      <p>
        A confiança de quem cria uma campanha e de quem doa é o mais importante
        para nós. Veja as medidas que protegem cada etapa.
      </p>

      <h2>Sua conta</h2>
      <ul>
        <li>Senha forte obrigatória e confirmação de e-mail no cadastro.</li>
        <li>Pedimos a sua senha de novo antes de ações importantes, como solicitar um saque.</li>
        <li>Você pode encerrar suas sessões quando quiser. A equipe interna usa autenticação em duas etapas.</li>
      </ul>

      <h2>Seu dinheiro</h2>
      <ul>
        <li>Uma doação só entra na campanha depois de o pagamento ser confirmado — nunca automaticamente pelo navegador.</li>
        <li>Se um pagamento é processado mais de uma vez, o sistema reconhece e não duplica a doação.</li>
        <li>Todo o histórico financeiro é permanente. Qualquer ajuste fica registrado e justificado.</li>
        <li>Ao pedir um saque, o valor é separado na hora — não dá para usar o mesmo dinheiro duas vezes.</li>
        <li>Se um repasse falha, o valor volta para o saldo disponível na mesma hora. Nada some.</li>
      </ul>

      <h2>Contra fraudes</h2>
      <ul>
        <li>Verificação de identidade antes do primeiro saque e para valores maiores.</li>
        <li>Monitoramento de comportamentos suspeitos, valores fora do padrão e contas repetidas.</li>
        <li>Podemos segurar um saldo ou bloquear uma conta em análise, sem apagar o histórico.</li>
        <li>Saques de valor alto passam por dupla aprovação.</li>
      </ul>

      <h2>A plataforma</h2>
      <ul>
        <li>Conexão sempre criptografada (HTTPS).</li>
        <li>Cada usuário só enxerga os próprios dados. Informações sensíveis ficam criptografadas.</li>
        <li>Registro de todas as ações da equipe e de todas as movimentações financeiras.</li>
        <li>Backups criptografados e conferência diária com os meios de pagamento.</li>
      </ul>

      <p>
        Encontrou uma vulnerabilidade? Escreva para{" "}
        <a href="mailto:seguranca@uniaoeforca.com.br">
          seguranca@uniaoeforca.com.br
        </a>
        .
      </p>
    </LegalPage>
  );
}
