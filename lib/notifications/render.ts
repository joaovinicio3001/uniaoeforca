import { formatBRL } from "@/lib/utils";

export type NotificationRow = {
  id: string;
  type: string;
  payload: unknown;
  read_at: string | null;
  created_at: string;
};

export type NotificationTone = "blue" | "green" | "amber" | "red";

export type NotificationView = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  tone: NotificationTone;
  read: boolean;
  createdAt: string;
};

function p(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : {};
}
function cents(v: unknown): string {
  return typeof v === "number" ? formatBRL(v) : "R$ 0,00";
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

/** Converte uma linha de `notifications` em texto legível + destino. */
export function renderNotification(n: NotificationRow): NotificationView {
  const d = p(n.payload);
  const base = {
    id: n.id,
    read: !!n.read_at,
    createdAt: n.created_at,
  };

  switch (n.type) {
    case "donation_confirmed":
      return {
        ...base,
        title: "Nova doação recebida",
        body: `Você recebeu ${cents(d.net_amount_cents)} em uma das suas campanhas.`,
        href: d.campaign_id ? `/painel/campanhas/${d.campaign_id}` : "/painel/campanhas",
        tone: "green",
      };

    case "withdrawal_approved":
      return {
        ...base,
        title: "Saque aprovado",
        body: `Seu saque de ${cents(d.amount_cents)} foi aprovado e está sendo enviado para a sua chave PIX.`,
        href: d.withdrawal_id ? `/painel/saques/${d.withdrawal_id}` : "/painel/saques",
        tone: "blue",
      };
    case "withdrawal_paid":
      return {
        ...base,
        title: "Saque pago",
        body: `${cents(d.net_cents)} foram enviados para a sua chave PIX.`,
        href: d.withdrawal_id ? `/painel/saques/${d.withdrawal_id}` : "/painel/saques",
        tone: "green",
      };
    case "withdrawal_rejected":
      return {
        ...base,
        title: "Saque recusado",
        body: str(d.reason)
          ? `Motivo: ${str(d.reason)}. O valor voltou para o seu saldo disponível.`
          : "O valor voltou para o seu saldo disponível.",
        href: d.withdrawal_id ? `/painel/saques/${d.withdrawal_id}` : "/painel/saques",
        tone: "red",
      };
    case "withdrawal_failed":
      return {
        ...base,
        title: "Não foi possível concluir o saque",
        body: "O valor voltou para o seu saldo disponível. Você pode tentar de novo.",
        href: d.withdrawal_id ? `/painel/saques/${d.withdrawal_id}` : "/painel/saques",
        tone: "amber",
      };

    case "kyc_submitted":
      return {
        ...base,
        title: "Documentos recebidos",
        body: "Sua verificação de identidade está em análise. Você receberá um retorno em breve.",
        href: "/painel/kyc",
        tone: "blue",
      };
    case "kyc_approved":
      return {
        ...base,
        title: "Identidade verificada",
        body: "Tudo certo com a sua verificação. Você já pode solicitar saques.",
        href: "/painel/saques",
        tone: "green",
      };
    case "kyc_rejected":
      return {
        ...base,
        title: "Verificação não aprovada",
        body: str(d.reason)
          ? `Motivo: ${str(d.reason)}. Você pode enviar os documentos novamente.`
          : "Você pode enviar os documentos novamente.",
        href: "/painel/kyc",
        tone: "red",
      };

    case "campaign_active":
      return {
        ...base,
        title: "Campanha aprovada",
        body: str(d.title)
          ? `"${str(d.title)}" foi aprovada e já está no ar.`
          : "Sua campanha foi aprovada e já está no ar.",
        href: d.campaign_id ? `/painel/campanhas/${d.campaign_id}` : "/painel/campanhas",
        tone: "green",
      };
    case "campaign_rejected":
      return {
        ...base,
        title: "Campanha reprovada",
        body: str(d.reason)
          ? `Motivo: ${str(d.reason)}. Ajuste os dados e reenvie.`
          : "Ajuste os dados e reenvie a campanha.",
        href: d.campaign_id ? `/painel/campanhas/${d.campaign_id}` : "/painel/campanhas",
        tone: "red",
      };
    case "campaign_blocked":
      return {
        ...base,
        title: "Campanha bloqueada",
        body: str(d.reason) ?? "Entre em contato com o suporte para mais informações.",
        href: d.campaign_id ? `/painel/campanhas/${d.campaign_id}` : "/painel/campanhas",
        tone: "red",
      };
    case "campaign_paused":
      return {
        ...base,
        title: "Campanha pausada",
        body: "Sua campanha foi pausada e não recebe doações no momento.",
        href: d.campaign_id ? `/painel/campanhas/${d.campaign_id}` : "/painel/campanhas",
        tone: "amber",
      };
    case "campaign_completed":
      return {
        ...base,
        title: "Campanha concluída",
        body: "Sua campanha foi encerrada.",
        href: d.campaign_id ? `/painel/campanhas/${d.campaign_id}` : "/painel/campanhas",
        tone: "blue",
      };

    case "account_blocked":
      return {
        ...base,
        title: "Conta bloqueada",
        body: str(d.reason)
          ? `Motivo: ${str(d.reason)}. Fale com o suporte para revisão.`
          : "O acesso à sua conta foi suspenso. Fale com o suporte para revisão.",
        href: null,
        tone: "red",
      };
    case "account_unblocked":
      return {
        ...base,
        title: "Conta reativada",
        body: "O acesso à sua conta foi restabelecido.",
        href: "/painel",
        tone: "green",
      };

    case "donation_refunded":
      return {
        ...base,
        title: "Doação estornada",
        body: `Uma doação de ${cents(d.amount_cents)} foi estornada${
          str(d.reason) ? `: ${str(d.reason)}` : "."
        }`,
        href: d.campaign_id
          ? `/painel/campanhas/${d.campaign_id}?aba=doacoes`
          : "/painel",
        tone: "amber",
      };

    case "support_reply":
      return {
        ...base,
        title: "Resposta no seu chamado",
        body: "A equipe de suporte respondeu. Toque para ver.",
        href: d.ticket_id
          ? `/painel/suporte/${d.ticket_id}`
          : "/painel/suporte",
        tone: "blue",
      };

    case "admin_message":
      return {
        ...base,
        title: str(d.title) ?? "Aviso da equipe União & Força",
        body: str(d.body) ?? "",
        href: str(d.href),
        tone: "blue",
      };

    default:
      return {
        ...base,
        title: n.type.replace(/_/g, " "),
        body: "",
        href: null,
        tone: "blue",
      };
  }
}

/** "há 3 min", "há 2 h", "ontem", "12/08". */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}
