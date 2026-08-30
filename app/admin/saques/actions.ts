"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import {
  staffTransition,
  dispatchPayout,
  refreshPayoutStatus,
  simulatePayoutOutcome,
} from "@/lib/withdrawals/service";

async function guard(perm: "withdrawal:review" | "withdrawal:approve") {
  const user = await requireStaff();
  if (!can(user.roles, perm)) redirect("/admin/saques?erro=sem-permissao");
  return user;
}

/** Inicia análise (requested → under_review). */
export async function startReviewAction(formData: FormData) {
  const user = await guard("withdrawal:review");
  const id = String(formData.get("withdrawalId") ?? "");
  await staffTransition({ withdrawalId: id, to: "under_review", actorUserId: user.id });
  revalidatePath(`/admin/saques/${id}`);
  redirect(`/admin/saques/${id}`);
}

/** Aprova (under_review → approved) e dispara o payout (→ processing). */
export async function approveWithdrawalAction(formData: FormData) {
  const user = await guard("withdrawal:approve");
  const id = String(formData.get("withdrawalId") ?? "");

  // garante under_review antes de aprovar
  const ur = await staffTransition({
    withdrawalId: id,
    to: "under_review",
    actorUserId: user.id,
  });
  // 'noop' se já estava em under_review — ok seguir

  const ap = await staffTransition({
    withdrawalId: id,
    to: "approved",
    actorUserId: user.id,
  });
  void ur;

  if (ap.result === "needs_second_approval") {
    revalidatePath(`/admin/saques/${id}`);
    redirect(`/admin/saques/${id}?ok=primeira-aprovacao`);
  }
  if (ap.result === "same_approver") {
    redirect(`/admin/saques/${id}?erro=${encodeURIComponent("A segunda aprovação precisa ser de outro analista.")}`);
  }
  if (!ap.ok && ap.result !== "noop") {
    redirect(`/admin/saques/${id}?erro=${encodeURIComponent(ap.result)}`);
  }

  const dp = await dispatchPayout(id, user.id);
  revalidatePath(`/admin/saques/${id}`);
  revalidatePath("/admin/saques");
  redirect(
    dp.ok
      ? `/admin/saques/${id}?ok=processando`
      : `/admin/saques/${id}?erro=${encodeURIComponent(dp.error ?? "payout")}`,
  );
}

export async function rejectWithdrawalAction(formData: FormData) {
  const user = await guard("withdrawal:review");
  const id = String(formData.get("withdrawalId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) redirect(`/admin/saques/${id}?erro=motivo-obrigatorio`);

  await staffTransition({ withdrawalId: id, to: "under_review", actorUserId: user.id });
  const r = await staffTransition({
    withdrawalId: id,
    to: "rejected",
    actorUserId: user.id,
    reason,
  });
  revalidatePath(`/admin/saques/${id}`);
  redirect(
    r.ok
      ? `/admin/saques/${id}?ok=rejeitado`
      : `/admin/saques/${id}?erro=${encodeURIComponent(r.result)}`,
  );
}

export async function checkPayoutStatusAction(formData: FormData) {
  await guard("withdrawal:review");
  const id = String(formData.get("withdrawalId") ?? "");
  await refreshPayoutStatus(id);
  revalidatePath(`/admin/saques/${id}`);
  redirect(`/admin/saques/${id}`);
}

/** Reenvia o payout para saques aprovados cujo dispatch falhou. */
export async function retryPayoutAction(formData: FormData) {
  const user = await guard("withdrawal:approve");
  const id = String(formData.get("withdrawalId") ?? "");
  const dp = await dispatchPayout(id, user.id);
  revalidatePath(`/admin/saques/${id}`);
  redirect(
    dp.ok
      ? `/admin/saques/${id}?ok=processando`
      : `/admin/saques/${id}?erro=${encodeURIComponent(dp.error ?? "payout")}`,
  );
}

/** Mock only — simula o desfecho do PIX Out. */
export async function simulatePayoutAction(formData: FormData) {
  await guard("withdrawal:approve");
  const id = String(formData.get("withdrawalId") ?? "");
  const outcome = formData.get("outcome") === "failed" ? "failed" : "complete";
  const r = await simulatePayoutOutcome(id, outcome);
  revalidatePath(`/admin/saques/${id}`);
  redirect(`/admin/saques/${id}?ok=${encodeURIComponent(r)}`);
}
