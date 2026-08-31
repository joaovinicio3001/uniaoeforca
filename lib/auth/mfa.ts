import "server-only";

import { createClient } from "@/lib/supabase/server";

export type MfaStatus = {
  enrolled: boolean; // tem um fator TOTP verificado
  pending: boolean; // tem um fator ainda não verificado (enroll incompleto)
  factorId: string | null;
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  /** true quando o usuário tem 2FA e a sessão ainda está em aal1. */
  needsChallenge: boolean;
};

export async function getMfaStatus(): Promise<MfaStatus> {
  const supabase = await createClient();

  const [{ data: factorsData }, { data: aalData }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  // `data.totp` já contém só fatores verificados; `data.all` tem os dois estados.
  const verified = (factorsData?.totp ?? [])[0] ?? null;
  const unverified =
    (factorsData?.all ?? []).find(
      (f) => f.factor_type === "totp" && f.status === "unverified",
    ) ?? null;

  const currentLevel = (aalData?.currentLevel ?? null) as MfaStatus["currentLevel"];
  const nextLevel = (aalData?.nextLevel ?? null) as MfaStatus["nextLevel"];

  return {
    enrolled: !!verified,
    pending: !verified && !!unverified,
    factorId: verified?.id ?? unverified?.id ?? null,
    currentLevel,
    nextLevel,
    needsChallenge:
      !!verified && nextLevel === "aal2" && currentLevel === "aal1",
  };
}
