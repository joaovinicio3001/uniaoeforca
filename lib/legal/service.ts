import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import {
  CURRENT_LEGAL_VERSIONS,
  LEGAL_DOCUMENTS,
  SIGNUP_LEGAL_DOCUMENTS,
  type LegalDocument,
} from "@/lib/legal/versions";

/** Registra o aceite de um ou mais documentos na versão vigente (idempotente). */
export async function recordAcceptances(params: {
  userId: string;
  documents: LegalDocument[];
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  if (!hasServiceRole() || params.documents.length === 0) return;
  const rows = params.documents.map((document) => ({
    user_id: params.userId,
    document,
    version: CURRENT_LEGAL_VERSIONS[document],
    ip: params.ip ?? null,
    user_agent: params.userAgent ?? null,
  }));
  try {
    await createAdminClient()
      .from("legal_acceptances")
      .upsert(rows, { onConflict: "user_id,document,version", ignoreDuplicates: true });
  } catch {
    /* best-effort */
  }
}

/** Aceite dos documentos do fluxo de cadastro. */
export async function recordSignupAcceptances(
  userId: string,
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordAcceptances({
    userId,
    documents: SIGNUP_LEGAL_DOCUMENTS,
    ip,
    userAgent,
  });
}

/** Documentos cuja versão vigente o usuário ainda não aceitou. */
export async function getPendingConsents(
  userId: string,
): Promise<LegalDocument[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("legal_acceptances")
    .select("document, version")
    .eq("user_id", userId);

  const accepted = new Set(
    (data ?? []).map((r) => `${r.document}:${r.version}`),
  );
  return LEGAL_DOCUMENTS.filter(
    (doc) => !accepted.has(`${doc}:${CURRENT_LEGAL_VERSIONS[doc]}`),
  );
}

/** Versões aceitas por documento (para a ficha do usuário no admin). */
export async function listUserAcceptances(userId: string) {
  if (!hasServiceRole()) return [];
  const { data } = await createAdminClient()
    .from("legal_acceptances")
    .select("document, version, accepted_at")
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false });
  return data ?? [];
}
