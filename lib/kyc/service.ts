import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import { extForMime } from "@/lib/storage";
import { sendEmail } from "@/lib/email/resend";

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

const KYC_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_DOC_BYTES = 10 * 1024 * 1024;

export async function submitEnhancedKyc(params: {
  userId: string;
  files: { kind: "id_front" | "id_back" | "selfie"; file: File }[];
}): Promise<{ ok: boolean; error?: string; caseId?: string }> {
  const admin = createAdminClient();

  for (const { file } of params.files) {
    if (file.size === 0 || file.size > MAX_DOC_BYTES) {
      return { ok: false, error: "Arquivo vazio ou acima de 10 MB." };
    }
    if (!KYC_MIME.includes(file.type)) {
      return { ok: false, error: "Formato inválido. Use JPG, PNG, WebP ou PDF." };
    }
  }

  const { data: kc, error } = await admin
    .from("kyc_cases")
    .insert({ user_id: params.userId, level: "enhanced", status: "pending" })
    .select("id")
    .single();
  if (error || !kc) return { ok: false, error: "Não foi possível abrir o caso." };

  for (const { kind, file } of params.files) {
    const ext =
      file.type === "application/pdf" ? "pdf" : (extForMime(file.type) ?? "bin");
    const key = `${params.userId}/${kc.id}/${kind}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("kyc-docs")
      .upload(key, Buffer.from(bytes), { contentType: file.type, upsert: true });
    if (upErr) {
      return { ok: false, error: "Falha no upload dos documentos." };
    }
    await admin.from("kyc_documents").insert({
      kyc_case_id: kc.id,
      kind,
      storage_key: key,
      byte_size: file.size,
    });
  }

  await writeAuditLog({
    actorUserId: params.userId,
    action: "kyc.submitted_enhanced",
    entityType: "kyc_case",
    entityId: kc.id,
  });
  return { ok: true, caseId: kc.id };
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
