import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv, publicEnv, hasServiceRole } from "@/lib/env";

/**
 * Envio de e-mail transacional via Resend (doc §17.1). No-op quando
 * RESEND_API_KEY não está configurada — o app nunca depende do e-mail para
 * funcionar (a notificação in-app é a fonte primária).
 */
type SendInput =
  | { to: string; subject: string; text: string; html?: string }
  | { userId: string; subject: string; text: string; html?: string };

export async function sendEmail(input: SendInput): Promise<{ sent: boolean }> {
  const env = serverEnv();
  if (!env.RESEND_API_KEY) return { sent: false };

  let to: string | null = "to" in input ? input.to : null;
  if (!to && "userId" in input && hasServiceRole()) {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(input.userId);
    to = data.user?.email ?? null;
  }
  if (!to) return { sent: false };

  const from =
    env.EMAIL_FROM ||
    `União & Força <nao-responda@${new URL(publicEnv.NEXT_PUBLIC_SITE_URL).hostname}>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
      cache: "no-store",
    });
    return { sent: res.ok };
  } catch {
    return { sent: false };
  }
}
