"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  finalizeEnhancedKyc,
  getOrCreateDraftEnhancedCase,
  uploadKycDoc,
} from "@/lib/kyc/service";
import type { KycDocKind, KycUploadState } from "@/lib/kyc/shared";

/** Cria/recupera o caso rascunho onde os documentos serão anexados. */
export async function startKycAction(): Promise<{
  ok: boolean;
  caseId?: string;
  already?: "pending" | "in_review" | "approved";
  message?: string;
}> {
  const user = await requireUser("/painel/kyc");
  const res = await getOrCreateDraftEnhancedCase(user.id);
  if (res.ok) return { ok: true, caseId: res.caseId };
  if (res.error.startsWith("already:")) {
    return {
      ok: false,
      already: res.error.slice(8) as "pending" | "in_review" | "approved",
    };
  }
  return { ok: false, message: res.error };
}

/** Envia UM documento (rápido — um arquivo por request). */
export async function uploadKycDocAction(
  _prev: KycUploadState,
  formData: FormData,
): Promise<KycUploadState> {
  const user = await requireUser("/painel/kyc");
  const rl = rateLimit(`kyc-upload:${user.id}`, {
    limit: 40,
    windowSeconds: 600,
  });
  if (!rl.ok) {
    return { status: "error", message: "Muitos envios. Aguarde um instante." };
  }

  const res = await uploadKycDoc({
    userId: user.id,
    caseId: String(formData.get("caseId") ?? ""),
    kind: String(formData.get("kind") ?? "") as KycDocKind,
    file: formData.get("file"),
  });
  if (!res.ok) {
    return { status: "error", message: res.error ?? "Falha no envio." };
  }
  return { status: "success", kinds: res.kinds };
}

/** Finaliza o envio: exige os 3 documentos, coloca em análise e notifica. */
export async function finalizeKycAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser("/painel/kyc");
  const rl = rateLimit(`kyc-finalize:${user.id}`, {
    limit: 5,
    windowSeconds: 600,
  });
  if (!rl.ok) {
    return { ok: false, message: "Aguarde um instante e tente novamente." };
  }

  const res = await finalizeEnhancedKyc({
    userId: user.id,
    caseId: String(formData.get("caseId") ?? ""),
  });
  if (!res.ok) {
    return { ok: false, message: res.error ?? "Não foi possível enviar." };
  }
  revalidatePath("/painel/kyc");
  return { ok: true, message: "Documentos enviados para análise." };
}
