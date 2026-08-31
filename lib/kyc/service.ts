import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import { extForMime } from "@/lib/storage";
import { sendEmail } from "@/lib/email/resend";
import {
  KYC_ACCEPT_MIME,
  KYC_MAX_DOC_BYTES,
  KYC_REQUIRED_KINDS,
  type KycDocKind,
} from "@/lib/kyc/shared";

export { KYC_REQUIRED_KINDS, type KycDocKind };

export type SubmitBasicResult =
  | { ok: true; status: string; autoApproved: boolean }
  | { ok: false; error: string };

export async function submitBasicKyc(params: {
  userId: string;
  fullName: string;
  birthDate: string; // yyyy-mm-dd
}): Promise<SubmitBasicResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("submit_basic_kyc", {
    p_user_id: params.userId,
    p_full_name: params.fullName,
    p_birth_date: params.birthDate,
  });
  if (error) return { ok: false, error: "Falha ao enviar a verificação." };
  const res = data as {
    ok: boolean;
    error?: string;
    status?: string;
    auto_approved?: boolean;
  };
  if (!res.ok) return { ok: false, error: res.error ?? "Falha na verificação." };

  await writeAuditLog({
    actorUserId: params.userId,
    action: "kyc.submitted_basic",
    entityType: "kyc_case",
    after: { auto_approved: res.auto_approved },
  });
  return {
    ok: true,
    status: res.status ?? "pending",
    autoApproved: !!res.auto_approved,
  };
}

const KYC_MIME: readonly string[] = KYC_ACCEPT_MIME;
const MAX_DOC_BYTES = KYC_MAX_DOC_BYTES;

/**
 * Caso ENHANCED "rascunho" (status `not_started`) do usuário — onde os
 * documentos vão sendo anexados um a um antes do envio. Não aparece na fila do
 * admin (que só lista `pending`/`in_review`).
 */
export async function getOrCreateDraftEnhancedCase(
  userId: string,
): Promise<{ ok: true; caseId: string } | { ok: false; error: string }> {
  const admin = createAdminClient();

  // Já tem enhanced aprovado ou em análise? Nada a fazer aqui.
  const { data: active } = await admin
    .from("kyc_cases")
    .select("id, status")
    .eq("user_id", userId)
    .eq("level", "enhanced")
    .in("status", ["pending", "in_review", "approved"])
    .maybeSingle();
  if (active) {
    return { ok: false, error: `already:${active.status}` };
  }

  const { data: draft } = await admin
    .from("kyc_cases")
    .select("id")
    .eq("user_id", userId)
    .eq("level", "enhanced")
    .eq("status", "not_started")
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (draft) return { ok: true, caseId: draft.id };

  const { data: created, error } = await admin
    .from("kyc_cases")
    .insert({ user_id: userId, level: "enhanced", status: "not_started" })
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, error: "Não foi possível iniciar a verificação." };
  }
  return { ok: true, caseId: created.id };
}

async function assertOwnedDraft(
  userId: string,
  caseId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("kyc_cases")
    .select("user_id, level, status")
    .eq("id", caseId)
    .maybeSingle();
  return (
    !!data &&
    data.user_id === userId &&
    data.level === "enhanced" &&
    data.status === "not_started"
  );
}

/** Envia UM documento do caso rascunho. Rápido: um arquivo por request. */
export async function uploadKycDoc(params: {
  userId: string;
  caseId: string;
  kind: KycDocKind;
  file: unknown;
}): Promise<{ ok: boolean; error?: string; kinds?: KycDocKind[] }> {
  const { userId, caseId, kind } = params;
  const file = params.file;

  if (!KYC_REQUIRED_KINDS.includes(kind)) {
    return { ok: false, error: "Documento inválido." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo." };
  }
  if (file.size > MAX_DOC_BYTES) {
    return { ok: false, error: "Arquivo acima de 12 MB." };
  }
  if (!KYC_MIME.includes(file.type)) {
    return { ok: false, error: "Formato inválido. Use JPG, PNG, WEBP ou PDF." };
  }
  if (!(await assertOwnedDraft(userId, caseId))) {
    return { ok: false, error: "Verificação inválida." };
  }

  const admin = createAdminClient();
  const ext =
    file.type === "application/pdf" ? "pdf" : (extForMime(file.type) ?? "bin");
  const key = `${userId}/${caseId}/${kind}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("kyc-docs")
    .upload(key, bytes, { contentType: file.type, upsert: true });
  if (upErr) {
    return { ok: false, error: "Não foi possível enviar este arquivo." };
  }

  await admin
    .from("kyc_documents")
    .delete()
    .eq("kyc_case_id", caseId)
    .eq("kind", kind);
  await admin.from("kyc_documents").insert({
    kyc_case_id: caseId,
    kind,
    storage_key: key,
    byte_size: file.size,
  });

  const { data: docs } = await admin
    .from("kyc_documents")
    .select("kind")
    .eq("kyc_case_id", caseId);
  return {
    ok: true,
    kinds: (docs ?? []).map((d) => d.kind as KycDocKind),
  };
}

/** Finaliza: exige os 3 documentos, coloca em análise, notifica e envia e-mail. */
export async function finalizeEnhancedKyc(params: {
  userId: string;
  caseId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { userId, caseId } = params;
  const admin = createAdminClient();

  if (!(await assertOwnedDraft(userId, caseId))) {
    return { ok: false, error: "Verificação inválida ou já enviada." };
  }

  const { data: docs } = await admin
    .from("kyc_documents")
    .select("kind")
    .eq("kyc_case_id", caseId);
  const have = new Set((docs ?? []).map((d) => d.kind));
  const missing = KYC_REQUIRED_KINDS.filter((k) => !have.has(k));
  if (missing.length > 0) {
    return {
      ok: false,
      error: "Envie a frente e o verso do documento e a selfie.",
    };
  }

  const { error } = await admin
    .from("kyc_cases")
    .update({ status: "pending", submitted_at: new Date().toISOString() })
    .eq("id", caseId);
  if (error) {
    return { ok: false, error: "Não foi possível enviar. Tente novamente." };
  }

  await admin.from("notifications").insert({
    user_id: userId,
    type: "kyc_submitted",
    payload: { level: "enhanced" },
  });
  await writeAuditLog({
    actorUserId: userId,
    action: "kyc.submitted_enhanced",
    entityType: "kyc_case",
    entityId: caseId,
  });
  await sendEmail({
    userId,
    subject: "Recebemos seus documentos — conta em análise",
    text: "Recebemos os documentos da sua verificação de identidade. Nossa equipe vai analisar e você receberá um retorno em breve, por e-mail e nas notificações do painel.",
  });

  return { ok: true };
}

// ---------- admin ----------
export async function reviewKycCase(params: {
  caseId: string;
  decision: "approved" | "rejected";
  riskLevel: "low" | "medium" | "high";
  reason?: string;
  actorId: string;
}): Promise<{ ok: boolean }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: kc } = await admin
    .from("kyc_cases")
    .select("user_id, level")
    .eq("id", params.caseId)
    .maybeSingle();

  await admin
    .from("kyc_cases")
    .update({
      status: params.decision,
      risk_level: params.riskLevel,
      rejection_reason: params.decision === "rejected" ? params.reason ?? null : null,
      reviewed_by: params.actorId,
      reviewed_at: now,
      approved_at: params.decision === "approved" ? now : null,
      expires_at:
        params.decision === "approved"
          ? new Date(Date.now() + 365 * 864e5).toISOString()
          : null,
    })
    .eq("id", params.caseId);

  await writeAuditLog({
    actorUserId: params.actorId,
    action: `kyc.${params.decision}`,
    entityType: "kyc_case",
    entityId: params.caseId,
    after: { risk_level: params.riskLevel, reason: params.reason ?? null },
  });

  if (kc) {
    await admin.from("notifications").insert({
      user_id: kc.user_id,
      type: `kyc_${params.decision}`,
      payload: { level: kc.level, reason: params.reason ?? null },
    });
    await sendEmail({
      userId: kc.user_id,
      subject:
        params.decision === "approved"
          ? "Sua verificação foi aprovada"
          : "Sua verificação precisa de ajustes",
      text:
        params.decision === "approved"
          ? "Boas notícias: sua identidade foi verificada. Você já pode solicitar saques."
          : `Não conseguimos concluir sua verificação. Motivo: ${params.reason ?? "não informado"}. Você pode reenviar pelo painel.`,
    });
  }
  return { ok: true };
}
