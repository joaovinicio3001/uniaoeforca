"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/security/audit";
import {
  getPendingConsents,
  recordAcceptances,
} from "@/lib/legal/service";
import { CURRENT_LEGAL_VERSIONS } from "@/lib/legal/versions";

/** Registra o aceite da versão vigente de todos os documentos pendentes. */
export async function acceptPendingConsentsAction() {
  const user = await requireUser();
  const pending = await getPendingConsents(user.id);
  if (pending.length === 0) return;

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;

  await recordAcceptances({
    userId: user.id,
    documents: pending,
    ip,
    userAgent: h.get("user-agent"),
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "legal.reconsent",
    entityType: "user",
    entityId: user.id,
    after: {
      documents: pending,
      versions: pending.map((d) => CURRENT_LEGAL_VERSIONS[d]),
    },
  });

  revalidatePath("/painel", "layout");
}
