"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(
  id: string,
): Promise<{ ok: boolean }> {
  const user = await requireUser("/painel/notificacoes");
  if (!id) return { ok: false };
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/painel", "layout");
  revalidatePath("/painel/notificacoes");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{
  ok: boolean;
}> {
  const user = await requireUser("/painel/notificacoes");
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/painel", "layout");
  revalidatePath("/painel/notificacoes");
  return { ok: true };
}
