"use server";

import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/security/audit";
import {
  allUserIds,
  notifyManyUsers,
  notifyUser,
} from "@/lib/notifications/service";

type SendState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function sendAdminNotificationAction(
  _prev: SendState,
  formData: FormData,
): Promise<SendState> {
  const staff = await requireStaff();

  const target = String(formData.get("target") ?? "all");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const hrefRaw = String(formData.get("href") ?? "").trim();
  const href =
    hrefRaw.startsWith("/") && !hrefRaw.startsWith("//") ? hrefRaw : undefined;

  if (title.length < 3) {
    return { status: "error", message: "Informe um título (mín. 3 caracteres)." };
  }
  if (body.length < 3) {
    return { status: "error", message: "Escreva a mensagem." };
  }

  const payload = { title, body, ...(href ? { href } : {}) };

  if (target === "user") {
    if (!email.includes("@")) {
      return { status: "error", message: "Informe o e-mail do destinatário." };
    }
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      return { status: "error", message: "Nenhum usuário com esse e-mail." };
    }
    await notifyUser(user.id, "admin_message", payload);
    await writeAuditLog({
      actorUserId: staff.id,
      action: "admin.notification_sent",
      entityType: "user",
      entityId: user.id,
      after: { title, scope: "user" },
    });
    return { status: "success", message: `Notificação enviada para ${email}.` };
  }

  const ids = await allUserIds();
  const sent = await notifyManyUsers(ids, "admin_message", payload);
  await writeAuditLog({
    actorUserId: staff.id,
    action: "admin.notification_sent",
    entityType: "user",
    after: { title, scope: "all", recipients: sent },
  });
  return {
    status: "success",
    message: `Notificação enviada para ${sent} ${sent === 1 ? "usuário" : "usuários"}.`,
  };
}
