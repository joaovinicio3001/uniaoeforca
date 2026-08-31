"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { extForMime, getStorageProvider } from "@/lib/storage";
import { updateProfileSchema } from "@/lib/validation/profile";
import type { ProfileFormState } from "@/lib/profile/form-state";

function zErrors(e: {
  issues: { path: (string | number)[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const i of e.issues) (out[String(i.path[0] ?? "_")] ??= []).push(i.message);
  return out;
}

// ------------------------------------------------------------------
// Informações pessoais — nome, nascimento, telefone (allowlist)
// ------------------------------------------------------------------
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser("/painel/perfil");

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    birthDate: formData.get("birthDate") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: zErrors(parsed.error),
    };
  }
  const input = parsed.data;

  // Cliente do usuário: a RLS `profiles_update_own` garante que só a própria
  // linha é afetada. Só colunas da allowlist são enviadas.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      display_name: input.fullName.split(/\s+/)[0],
      birth_date: input.birthDate || null,
      phone: input.phone || null,
    })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: "Não foi possível atualizar seu perfil. Tente novamente.",
    };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "profile.updated",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/painel", "layout");
  revalidatePath("/painel/perfil");
  return { status: "success", message: "Perfil atualizado com sucesso." };
}

// ------------------------------------------------------------------
// Preferências de comunicação — persistência real
// ------------------------------------------------------------------
export async function updatePreferencesAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser("/painel/perfil");

  const campaignActivity = formData.get("campaignActivity") === "true";
  const platformUpdates = formData.get("platformUpdates") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      notify_campaign_activity: campaignActivity,
      marketing_opt_in: platformUpdates,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Não foi possível salvar suas preferências." };
  }

  revalidatePath("/painel/perfil");
  return { ok: true, message: "Preferências salvas." };
}

// ------------------------------------------------------------------
// Foto de perfil
// ------------------------------------------------------------------
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function updateAvatarAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser("/painel/perfil");

  const rl = rateLimit(`avatar:${user.id}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.ok) {
    return { status: "error", message: "Muitas tentativas. Tente mais tarde." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione uma imagem." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { status: "error", message: "A imagem precisa ter no máximo 5 MB." };
  }
  const ext = extForMime(file.type);
  if (!ext) {
    return {
      status: "error",
      message: "Formato inválido. Use JPG, PNG ou WebP.",
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const okMagic =
    (ext === "jpg" && bytes[0] === 0xff && bytes[1] === 0xd8) ||
    (ext === "png" && bytes[0] === 0x89 && bytes[1] === 0x50) ||
    (ext === "webp" &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46);
  if (!okMagic) {
    return {
      status: "error",
      message: "O arquivo não parece ser uma imagem válida.",
    };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const storage = await getStorageProvider();
  const key = `avatars/${user.id}/${crypto.randomUUID().replace(/-/g, "")}.${ext}`;

  let put;
  try {
    put = await storage.put({ key, body: bytes, contentType: file.type });
  } catch {
    return { status: "error", message: "Não foi possível enviar essa imagem." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: put.publicUrl })
    .eq("id", user.id);
  if (error) {
    await storage.remove(key).catch(() => {});
    return { status: "error", message: "Não foi possível salvar a foto." };
  }

  // Remove o arquivo antigo (best-effort) para não acumular órfãos.
  const oldUrl = current?.avatar_url;
  if (oldUrl && oldUrl !== put.publicUrl) {
    const marker = "/avatars/";
    const idx = oldUrl.indexOf(marker);
    if (idx !== -1) {
      await storage.remove(`avatars/${oldUrl.slice(idx + marker.length)}`).catch(
        () => {},
      );
    }
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "profile.avatar_updated",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/painel", "layout");
  revalidatePath("/painel/perfil");
  return {
    status: "success",
    message: "Foto atualizada.",
    avatarUrl: put.publicUrl,
  };
}
