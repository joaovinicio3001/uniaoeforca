import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole, publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/resend";
import { renderNotification } from "@/lib/notifications/render";

/**
 * Tipos de notificação que também disparam e-mail transacional. Avisos de
 * broadcast e ruído de baixa relevância ficam só no sino.
 */
const EMAILABLE = new Set<string>([
  "donation_confirmed",
  "withdrawal_approved",
  "withdrawal_paid",
  "withdrawal_rejected",
  "withdrawal_failed",
  "kyc_approved",
  "kyc_rejected",
  "campaign_active",
  "campaign_rejected",
  "campaign_blocked",
  "support_reply",
  "account_blocked",
  "account_unblocked",
  "donation_refunded",
  "admin_message",
]);

function bodyFor(type: string, payload: unknown): { subject: string; text: string } {
  const v = renderNotification({
    id: "",
    type,
    payload,
    read_at: null,
    created_at: new Date().toISOString(),
  });
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const link = v.href ? `\n\n${base}${v.href}` : "";
  return {
    subject: `${v.title} — União & Força`,
    text:
      `${v.body}${link}\n\n` +
      `Você recebeu este e-mail porque tem uma conta na União & Força. ` +
      `Acompanhe tudo pelo painel.`,
  };
}

/**
 * Envia por e-mail as notificações ainda não enviadas (best-effort).
 * Idempotente pela coluna emailed_at. Chamado após criar notificações e pelo
 * cron horário como rede de segurança para as geradas direto no banco.
 */
export async function flushNotificationEmails(opts?: {
  userId?: string;
  limit?: number;
}): Promise<{ sent: number }> {
  if (!hasServiceRole()) return { sent: 0 };
  const admin = createAdminClient();

  let q = admin
    .from("notifications")
    .select("id, user_id, type, payload")
    .is("emailed_at", null)
    .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: true })
    .limit(opts?.limit ?? 50);
  if (opts?.userId) q = q.eq("user_id", opts.userId);

  const { data: rows } = await q;
  if (!rows?.length) return { sent: 0 };

  let sent = 0;
  for (const n of rows) {
    if (!EMAILABLE.has(n.type)) {
      await admin
        .from("notifications")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", n.id);
      continue;
    }
    try {
      const { subject, text } = bodyFor(n.type, n.payload);
      const res = await sendEmail({ userId: n.user_id, subject, text });
      if (res.sent) sent += 1;
    } catch {
      /* ignora — tenta de novo no próximo ciclo se ainda dentro da janela */
    }
    await admin
      .from("notifications")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", n.id);
  }
  return { sent };
}
