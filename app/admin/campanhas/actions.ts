"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import { transitionCampaign } from "@/lib/campaigns/mutations";
import type { CampaignStatus } from "@/lib/campaigns/state-machine";

async function staffGuard() {
  const user = await requireStaff();
  if (!can(user.roles, "campaign:review")) redirect("/admin/campanhas?erro=sem-permissao");
  return user;
}

async function moderate(
  formData: FormData,
  to: CampaignStatus,
  opts: { requireReason?: boolean } = {},
) {
  const user = await staffGuard();
  const id = String(formData.get("campaignId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (opts.requireReason && reason.length < 5) {
    redirect(`/admin/campanhas/${id}?erro=motivo-obrigatorio`);
  }
  const res = await transitionCampaign({
    campaignId: id,
    to,
    actor: "staff",
    actorUserId: user.id,
    reason: reason || undefined,
    notifyOwner: true,
  });
  revalidatePath(`/admin/campanhas/${id}`);
  revalidatePath("/admin/campanhas");
  redirect(
    res.ok
      ? `/admin/campanhas/${id}?ok=${to}`
      : `/admin/campanhas/${id}?erro=${encodeURIComponent(res.error)}`,
  );
}

export async function approveCampaignAction(fd: FormData) {
  await moderate(fd, "active");
}
export async function rejectCampaignAction(fd: FormData) {
  await moderate(fd, "rejected", { requireReason: true });
}
export async function blockCampaignAction(fd: FormData) {
  await moderate(fd, "blocked", { requireReason: true });
}
export async function unblockCampaignAction(fd: FormData) {
  await moderate(fd, "active");
}

export async function resolveReportAction(formData: FormData) {
  const user = await staffGuard();
  const reportId = String(formData.get("reportId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");
  const decision = String(formData.get("decision") ?? ""); // "actioned" | "dismissed"
  const note = String(formData.get("note") ?? "").trim() || null;
  if (decision !== "actioned" && decision !== "dismissed") {
    redirect(`/admin/campanhas/${campaignId}`);
  }

  const admin = createAdminClient();
  await admin
    .from("reports")
    .update({
      status: decision,
      resolution_note: note,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  await writeAuditLog({
    actorUserId: user.id,
    action: `report.${decision}`,
    entityType: "report",
    entityId: reportId,
    after: { note },
  });

  revalidatePath(`/admin/campanhas/${campaignId}`);
  redirect(`/admin/campanhas/${campaignId}?ok=denuncia`);
}
