"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import {
  runPixInReconciliation,
  runPixOutReconciliation,
  runLedgerInternalReconciliation,
  resolveReconItem,
} from "@/lib/reconciliation/service";

async function guard() {
  const user = await requireStaff();
  if (!can(user.roles, "reconciliation:manage")) {
    redirect("/admin/conciliacao?erro=sem-permissao");
  }
  return user;
}

export async function runReconAction(formData: FormData) {
  await guard();
  const kind = String(formData.get("kind") ?? "");
  if (kind === "pix_in") await runPixInReconciliation();
  else if (kind === "pix_out") await runPixOutReconciliation();
  else await runLedgerInternalReconciliation();
  revalidatePath("/admin/conciliacao");
  redirect("/admin/conciliacao?ok=rodou");
}

export async function resolveReconItemAction(formData: FormData) {
  const user = await guard();
  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 3) redirect("/admin/conciliacao?erro=nota-obrigatoria");
  await resolveReconItem({
    itemId: String(formData.get("itemId") ?? ""),
    note,
    actorId: user.id,
  });
  revalidatePath("/admin/conciliacao");
  redirect("/admin/conciliacao?ok=resolvido");
}
