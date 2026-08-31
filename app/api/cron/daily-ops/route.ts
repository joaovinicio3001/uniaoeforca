import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import { finalizeProcessingPayouts } from "@/lib/withdrawals/service";
import { flushNotificationEmails } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) return false;
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Rotina operacional diária (doc §29): expira cobranças PIX pendentes e
 * sinaliza saques próximos do SLA de 24h.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const admin = createAdminClient();

  const { data: expired } = await admin.rpc("expire_stale_payments", { p_hours: 25 });
  const { data: nearSla } = await admin.rpc("withdrawals_near_sla", { p_hours: 20 });

  // Backstop de webhook: finaliza saques que o provedor já concluiu.
  const payouts = await finalizeProcessingPayouts({ limit: 50 }).catch(() => ({
    checked: 0,
    paid: 0,
    failed: 0,
  }));

  // Rede de segurança dos e-mails de notificação gerados no banco.
  const emails = await flushNotificationEmails({ limit: 200 }).catch(() => ({
    sent: 0,
  }));

  const slaList = (nearSla ?? []) as { id: string; requested_at: string }[];
  if (slaList.length > 0) {
    await writeAuditLog({
      actorUserId: null,
      action: "ops.sla_warning",
      entityType: "withdrawal",
      after: { count: slaList.length, ids: slaList.map((w) => w.id).slice(0, 50) },
    });
    // Notifica todo o staff financeiro.
    const { data: staff } = await admin
      .from("user_roles")
      .select("user_id")
      .in("role", ["financeiro", "admin", "superadmin"]);
    for (const s of staff ?? []) {
      await admin.from("notifications").insert({
        user_id: s.user_id,
        type: "ops_sla_warning",
        payload: { withdrawals_near_sla: slaList.length },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    expired_payments: expired ?? 0,
    withdrawals_near_sla: slaList.length,
    payouts_finalized: payouts,
    notification_emails_sent: emails.sent,
  });
}
