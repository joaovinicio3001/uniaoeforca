import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export type KycCase = Database["public"]["Tables"]["kyc_cases"]["Row"];

export type KycSummary = {
  hasBasic: boolean;
  hasEnhanced: boolean;
  latestStatus: string | null;
  latestCase: KycCase | null;
};

export async function getMyKycSummary(): Promise<KycSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { hasBasic: false, hasEnhanced: false, latestStatus: null, latestCase: null };
  }
  const { data } = await supabase
    .from("kyc_cases")
    .select("*")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });

  const cases = data ?? [];
  const now = Date.now();
  const isApproved = (c: KycCase) =>
    c.status === "approved" &&
    (!c.expires_at || new Date(c.expires_at).getTime() > now);
  const hasEnhanced = cases.some((c) => c.level === "enhanced" && isApproved(c));

  // Verificação virou só documento (enhanced). Um enhanced aprovado já satisfaz
  // o requisito "básico" usado no fluxo de saque — alinhado a private.kyc_summary_for.
  return {
    hasBasic: hasEnhanced || cases.some((c) => isApproved(c)),
    hasEnhanced,
    latestStatus: cases[0]?.status ?? null,
    latestCase: cases[0] ?? null,
  };
}

// ---------- admin ----------
export async function listKycQueue() {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("kyc_cases")
    .select("id, user_id, level, status, risk_level, submitted_at, full_name_submitted")
    .in("status", ["pending", "in_review"])
    .order("submitted_at", { ascending: true });
  return data ?? [];
}

export async function getKycCaseForReview(id: string) {
  if (!hasServiceRole()) return null;
  const admin = createAdminClient();
  const { data: kc } = await admin
    .from("kyc_cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!kc) return null;

  const [{ data: profile }, { data: docs }] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, birth_date, cpf_last3, status")
      .eq("id", kc.user_id)
      .maybeSingle(),
    admin
      .from("kyc_documents")
      .select("id, kind, storage_key")
      .eq("kyc_case_id", id),
  ]);

  // URLs assinadas (60 min) para os documentos privados.
  const documents = await Promise.all(
    (docs ?? []).map(async (d) => {
      const { data: signed } = await admin.storage
        .from("kyc-docs")
        .createSignedUrl(d.storage_key, 3600);
      return { id: d.id, kind: d.kind, url: signed?.signedUrl ?? null };
    }),
  );

  return { kycCase: kc, profile: profile ?? null, documents };
}
