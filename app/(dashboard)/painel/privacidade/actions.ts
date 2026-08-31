"use server";

import { revalidatePath } from "next/cache";

import { requireUser, getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyPassword } from "@/lib/withdrawals/service";
import { getMyWalletBalance } from "@/lib/ledger/queries";

type Result = { ok: boolean; message: string; blocked?: boolean };

/**
 * Núcleo: registra uma solicitação de exclusão (LGPD). Não apaga nada agora —
 * cria um `data_requests` (kind=deletion, status=pending) que a equipe processa
 * (anonimização de dados pessoais, preservando/anonimizando o que a lei exige
 * manter). Idempotente: se já há solicitação aberta, não cria outra.
 */
async function submitDeletionRequest(userId: string): Promise<Result> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("data_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", "deletion")
    .in("status", ["pending", "processing"])
    .maybeSingle();
  if (existing) {
    return {
      ok: true,
      message: "Você já tem uma solicitação de exclusão em andamento.",
    };
  }

  await admin
    .from("data_requests")
    .insert({ user_id: userId, kind: "deletion" });
  await writeAuditLog({
    actorUserId: userId,
    action: "lgpd.deletion_requested",
    entityType: "user",
    entityId: userId,
  });
  revalidatePath("/painel/privacidade");
  revalidatePath("/painel/perfil");
  return {
    ok: true,
    message:
      "Solicitação registrada. Concluiremos a exclusão/anonimização respeitando os prazos legais de retenção de dados financeiros.",
  };
}

/** Fluxo simples (2 cliques) — usado pela aba Perfil. */
export async function requestAccountDeletionAction(): Promise<Result> {
  const user = await requireUser("/painel/privacidade");
  return submitDeletionRequest(user.id);
}

/**
 * Fluxo reforçado (aba Privacidade): reautenticação por senha + checagem de
 * saldo disponível antes de aceitar a solicitação.
 */
export async function requestAccountDeletionWithPasswordAction(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const user = await requireUser("/painel/privacidade");
  const session = await getSessionUser();
  if (!session?.email) {
    return { ok: false, message: "Sessão inválida. Entre novamente." };
  }

  const rl = rateLimit(`account-deletion:${user.id}`, {
    limit: 5,
    windowSeconds: 900,
  });
  if (!rl.ok) {
    return {
      ok: false,
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { ok: false, message: "Digite sua senha para confirmar." };
  }
  if (!(await verifyPassword(session.email, password))) {
    return { ok: false, message: "Senha incorreta." };
  }

  // Integridade financeira: não aceitar exclusão com dinheiro sacável parado.
  const balance = await getMyWalletBalance();
  if (balance.available_cents > 0) {
    return {
      ok: false,
      blocked: true,
      message:
        "Você ainda tem saldo disponível. Solicite o saque antes de pedir a exclusão da conta.",
    };
  }

  return submitDeletionRequest(user.id);
}
