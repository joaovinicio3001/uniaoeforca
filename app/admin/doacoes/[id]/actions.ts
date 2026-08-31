"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { refundDonation, markRefundSettled } from "@/lib/payments/refunds";

async function guard() {
  const user = await requireStaff();
  // Estorno mexe no ledger — exige alçada financeira.
  if (!can(user.roles, "reconciliation:manage")) {
    redirect("/admin/doacoes?erro=sem-permissao");
  }
  return user;
}

export async function refundDonationAction(formData: FormData) {
  const staff = await guard();
  const id = String(formData.get("donationId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) {
    redirect(`/admin/doacoes/${id}?erro=motivo-obrigatorio`);
  }
  const r = await refundDonation({
    donationId: id,
    actorId: staff.id,
    reason,
  });
  revalidatePath(`/admin/doacoes/${id}`);
  redirect(
    r.ok
      ? `/admin/doacoes/${id}?ok=estornado`
      : `/admin/doacoes/${id}?erro=${encodeURIComponent(r.error ?? "falha")}`,
  );
}

export async function markRefundSettledAction(formData: FormData) {
  const staff = await guard();
  const id = String(formData.get("donationId") ?? "");
  await markRefundSettled(id, staff.id);
  revalidatePath(`/admin/doacoes/${id}`);
  redirect(`/admin/doacoes/${id}?ok=baixa`);
}
