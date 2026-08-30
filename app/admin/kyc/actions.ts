"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { reviewKycCase } from "@/lib/kyc/service";

export async function reviewKycAction(formData: FormData) {
  const user = await requireStaff();
  if (!can(user.roles, "kyc:review")) redirect("/admin/kyc?erro=sem-permissao");

  const caseId = String(formData.get("caseId") ?? "");
  const decision = formData.get("decision") === "rejected" ? "rejected" : "approved";
  const riskLevel = (["low", "medium", "high"] as const).includes(
    formData.get("riskLevel") as never,
  )
    ? (formData.get("riskLevel") as "low" | "medium" | "high")
    : "low";
  const reason = String(formData.get("reason") ?? "").trim() || undefined;

  if (decision === "rejected" && (!reason || reason.length < 5)) {
    redirect(`/admin/kyc/${caseId}?erro=motivo-obrigatorio`);
  }

  await reviewKycCase({
    caseId,
    decision,
    riskLevel,
    reason,
    actorId: user.id,
  });
  revalidatePath(`/admin/kyc/${caseId}`);
  revalidatePath("/admin/kyc");
  redirect(`/admin/kyc/${caseId}?ok=${decision}`);
}
