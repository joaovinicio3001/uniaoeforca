"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import {
  resolveRiskFlag,
  setUserBlock,
  placeHold,
  releaseHold,
} from "@/lib/risk/service";

async function guard() {
  const user = await requireStaff();
  return user;
}

export async function resolveFlagAction(formData: FormData) {
  const user = await guard();
  await resolveRiskFlag({
    flagId: String(formData.get("flagId") ?? ""),
    decision: formData.get("decision") === "dismissed" ? "dismissed" : "resolved",
    note: String(formData.get("note") ?? "").trim() || undefined,
    actorId: user.id,
  });
  revalidatePath("/admin/risco");
  redirect("/admin/risco");
}

export async function blockUserAction(formData: FormData) {
  const user = await guard();
  if (!can(user.roles, "campaign:moderate"))
    redirect("/admin/risco?erro=sem-permissao");
  const userId = String(formData.get("userId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const block = formData.get("block") !== "false";
  if (!/^[0-9a-f-]{36}$/i.test(userId) || (block && reason.length < 5)) {
    redirect("/admin/risco?erro=dados-invalidos");
  }
  await setUserBlock({ userId, reason, blocked: block, actorId: user.id });
  revalidatePath("/admin/risco");
  redirect(`/admin/risco?ok=${block ? "bloqueado" : "desbloqueado"}`);
}

export async function placeHoldAction(formData: FormData) {
  const user = await guard();
  if (!can(user.roles, "reconciliation:manage"))
    redirect("/admin/risco?erro=sem-permissao");
  const walletId = String(formData.get("walletId") ?? "").trim();
  const reais = Number(
    String(formData.get("amount") ?? "").replace(/\./g, "").replace(",", "."),
  );
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(walletId) || !(reais > 0) || reason.length < 5) {
    redirect("/admin/risco?erro=dados-invalidos");
  }
  const r = await placeHold({
    walletId,
    amountCents: Math.round(reais * 100),
    reason,
    actorId: user.id,
  });
  revalidatePath("/admin/risco");
  redirect(
    r.ok ? "/admin/risco?ok=hold" : `/admin/risco?erro=${encodeURIComponent(r.error ?? "hold")}`,
  );
}

export async function releaseHoldAction(formData: FormData) {
  const user = await guard();
  if (!can(user.roles, "reconciliation:manage"))
    redirect("/admin/risco?erro=sem-permissao");
  await releaseHold(String(formData.get("holdId") ?? ""), user.id);
  revalidatePath("/admin/risco");
  redirect("/admin/risco?ok=hold-liberado");
}
