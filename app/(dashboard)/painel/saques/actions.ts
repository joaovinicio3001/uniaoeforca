"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser, getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  addPixKeySchema,
  requestWithdrawalSchema,
} from "@/lib/withdrawals/validation";
import {
  addPixKey,
  disablePixKey,
  requestWithdrawal,
  verifyPassword,
} from "@/lib/withdrawals/service";
import { recordIpSignal } from "@/lib/risk/signals";
import type { WithdrawalFormState } from "@/lib/withdrawals/form-state";

function zErr(e: { issues: { path: (string | number)[]; message: string }[] }) {
  const o: Record<string, string[]> = {};
  for (const i of e.issues) (o[String(i.path[0] ?? "_")] ??= []).push(i.message);
  return o;
}

export async function addPixKeyAction(
  _prev: WithdrawalFormState,
  formData: FormData,
): Promise<WithdrawalFormState> {
  const user = await requireUser("/painel/saques/chaves");
  const parsed = addPixKeySchema.safeParse({
    type: formData.get("type"),
    value: formData.get("value"),
    ownerName: formData.get("ownerName") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da chave.",
      fieldErrors: zErr(parsed.error),
    };
  }
  const res = await addPixKey({ userId: user.id, input: parsed.data });
  if (!res.ok) return { status: "error", message: res.error };
  revalidatePath("/painel/saques/chaves");
  return { status: "success", message: "Chave PIX cadastrada." };
}

export async function disablePixKeyAction(formData: FormData) {
  const user = await requireUser("/painel/saques/chaves");
  await disablePixKey(user.id, String(formData.get("keyId") ?? ""));
  revalidatePath("/painel/saques/chaves");
  redirect("/painel/saques/chaves");
}

export async function requestWithdrawalAction(
  _prev: WithdrawalFormState,
  formData: FormData,
): Promise<WithdrawalFormState> {
  const user = await requireUser("/painel/saques/nova");
  const session = await getSessionUser();
  if (!session?.email) {
    return { status: "error", message: "Sessão inválida. Entre novamente." };
  }

  const rl = rateLimit(`withdrawal:${user.id}`, { limit: 6, windowSeconds: 3600 });
  if (!rl.ok) {
    return { status: "error", message: "Muitas solicitações. Tente mais tarde." };
  }

  const parsed = requestWithdrawalSchema.safeParse({
    pixKeyId: formData.get("pixKeyId"),
    amount: formData.get("amount"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados do saque.",
      fieldErrors: zErr(parsed.error),
    };
  }

  if (!(await verifyPassword(session.email, parsed.data.password))) {
    return {
      status: "error",
      message: "Senha incorreta.",
      fieldErrors: { password: ["Senha incorreta."] },
    };
  }

  await recordIpSignal(user.id);
  const res = await requestWithdrawal({
    userId: user.id,
    pixKeyId: parsed.data.pixKeyId,
    amountCents: parsed.data.amount,
  });
  if (!res.ok) return { status: "error", message: res.error };

  redirect(`/painel/saques/${res.withdrawalId}`);
}

export async function cancelWithdrawalAction(formData: FormData) {
  const user = await requireUser("/painel/saques");
  const id = String(formData.get("withdrawalId") ?? "");
  const admin = createAdminClient();
  const { data: w } = await admin
    .from("withdrawals")
    .select("user_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!w || w.user_id !== user.id) redirect("/painel/saques");
  if (!["requested", "under_review"].includes(w.status)) {
    redirect(`/painel/saques/${id}?erro=nao-cancelavel`);
  }
  await admin.rpc("transition_withdrawal", {
    p_withdrawal_id: id,
    p_to: "canceled",
    p_actor_user_id: user.id,
    p_actor: "owner",
  });
  revalidatePath(`/painel/saques/${id}`);
  redirect(`/painel/saques/${id}`);
}
