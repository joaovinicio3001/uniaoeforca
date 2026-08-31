"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { setSetting } from "@/lib/settings/service";
import { writeAuditLog } from "@/lib/security/audit";

type FieldSpec =
  | { key: string; kind: "int"; min: number; max: number }
  | { key: string; kind: "bool" }
  | { key: string; kind: "text"; max: number };

const FIELDS: FieldSpec[] = [
  { key: "withdrawal_min_cents", kind: "int", min: 100, max: 100_000_00 },
  { key: "withdrawal_pix_key_cooldown_hours", kind: "int", min: 0, max: 720 },
  { key: "withdrawal_daily_max_cents", kind: "int", min: 1000, max: 2_000_000_00 },
  { key: "release_delay_hours", kind: "int", min: 0, max: 720 },
  { key: "maintenance_mode", kind: "bool" },
  { key: "maintenance_message", kind: "text", max: 300 },
  { key: "support_email", kind: "text", max: 160 },
];

export async function saveSettingsAction(formData: FormData) {
  const staff = await requireStaff();
  if (!can(staff.roles, "admin:settings")) {
    redirect("/admin/configuracoes?erro=sem-permissao");
  }

  const changed: string[] = [];
  for (const f of FIELDS) {
    const raw = formData.get(f.key);

    if (f.kind === "bool") {
      const value = raw === "on" || raw === "true";
      const r = await setSetting(f.key, value, staff.id);
      if (!r.ok) redirect(`/admin/configuracoes?erro=${encodeURIComponent(r.error ?? "erro")}`);
      changed.push(f.key);
      continue;
    }

    if (raw == null) continue;
    const s = String(raw).trim();

    if (f.kind === "int") {
      const n = Math.round(Number(s.replace(/\D/g, "")));
      if (!Number.isFinite(n) || n < f.min || n > f.max) {
        redirect(
          `/admin/configuracoes?erro=${encodeURIComponent(
            `Valor inválido para ${f.key} (${f.min}–${f.max}).`,
          )}`,
        );
      }
      const r = await setSetting(f.key, n, staff.id);
      if (!r.ok) redirect(`/admin/configuracoes?erro=${encodeURIComponent(r.error ?? "erro")}`);
      changed.push(f.key);
    } else {
      if (s.length > f.max) {
        redirect(
          `/admin/configuracoes?erro=${encodeURIComponent(
            `Texto muito longo para ${f.key}.`,
          )}`,
        );
      }
      const r = await setSetting(f.key, s, staff.id);
      if (!r.ok) redirect(`/admin/configuracoes?erro=${encodeURIComponent(r.error ?? "erro")}`);
      changed.push(f.key);
    }
  }

  await writeAuditLog({
    actorUserId: staff.id,
    action: "admin.settings_updated",
    entityType: "app_settings",
    after: { keys: changed },
  });

  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes?ok=salvo");
}
