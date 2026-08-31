"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { ensureUniqueSlug } from "@/lib/campaigns/slug";
import { sanitizeRichText } from "@/lib/campaigns/sanitize";
import {
  campaignDraftSchema,
  campaignUpdateSchema,
} from "@/lib/campaigns/validation";
import { transitionCampaign, setCampaignCover } from "@/lib/campaigns/mutations";
import {
  extForMime,
  getStorageProvider,
  randomAssetKey,
} from "@/lib/storage";
import type {
  CampaignFormState,
  CampaignMediaLite,
} from "@/lib/campaigns/form-state";

function zErrors(e: { issues: { path: (string | number)[]; message: string }[] }) {
  const out: Record<string, string[]> = {};
  for (const i of e.issues) (out[String(i.path[0] ?? "_")] ??= []).push(i.message);
  return out;
}

async function resolveCategoryId(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

// ------------------------------------------------------------------
// Criar rascunho (doc §4.1)
// ------------------------------------------------------------------
export async function createCampaignAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser("/painel/campanhas/nova");

  const rl = rateLimit(`campaign-create:${user.id}`, {
    limit: 10,
    windowSeconds: 3600,
  });
  if (!rl.ok) {
    return { status: "error", message: "Muitas campanhas criadas. Tente mais tarde." };
  }

  const parsed = campaignDraftSchema.safeParse({
    title: formData.get("title"),
    categorySlug: formData.get("categorySlug"),
    summary: formData.get("summary"),
    story: formData.get("story") ?? "",
    goalAmount: formData.get("goalAmount"),
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: zErrors(parsed.error),
    };
  }
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("campaigns")
    .select("slug")
    .ilike("slug", `${input.title.slice(0, 40)}%`);
  const slug = ensureUniqueSlug(
    input.title,
    (existing ?? []).map((r) => r.slug),
  );

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("campaigns")
    .insert({
      owner_user_id: user.id,
      title: input.title,
      slug,
      summary: input.summary,
      story: sanitizeRichText(input.story),
      category_id: await resolveCategoryId(input.categorySlug),
      goal_amount_cents: input.goalAmount,
      city: input.city || null,
      state: input.state || null,
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error || !created) {
    return { status: "error", message: "Não foi possível criar a campanha." };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "campaign.create",
    entityType: "campaign",
    entityId: created.id,
    after: { slug: created.slug, goal_amount_cents: input.goalAmount },
  });

  redirect(`/painel/campanhas/${created.id}`);
}

// ------------------------------------------------------------------
// Salvar rascunho (edição enquanto draft/rejected)
// ------------------------------------------------------------------
export async function saveCampaignAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  if (!id) return { status: "error", message: "Campanha inválida." };

  const parsed = campaignDraftSchema.safeParse({
    title: formData.get("title"),
    categorySlug: formData.get("categorySlug"),
    summary: formData.get("summary"),
    story: formData.get("story") ?? "",
    goalAmount: formData.get("goalAmount"),
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: zErrors(parsed.error),
    };
  }
  const input = parsed.data;

  // RLS garante: só o dono e só enquanto draft/rejected.
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({
      title: input.title,
      summary: input.summary,
      story: sanitizeRichText(input.story),
      category_id: await resolveCategoryId(input.categorySlug),
      goal_amount_cents: input.goalAmount,
      city: input.city || null,
      state: input.state || null,
    })
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    return {
      status: "error",
      message:
        "Não foi possível salvar. Campanhas em análise ou publicadas não podem ser editadas aqui.",
    };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "campaign.update",
    entityType: "campaign",
    entityId: id,
  });
  revalidatePath(`/painel/campanhas/${id}`);
  return { status: "success", message: "Alterações salvas.", campaignId: id };
}

// ------------------------------------------------------------------
// Transições disparadas pelo dono
// ------------------------------------------------------------------
async function ownerGuard(campaignId: string): Promise<string> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaigns")
    .select("owner_user_id")
    .eq("id", campaignId)
    .maybeSingle();
  if (!data || data.owner_user_id !== user.id) redirect("/painel/campanhas");
  return user.id;
}

export async function submitForReviewAction(formData: FormData) {
  const id = String(formData.get("campaignId") ?? "");
  const uid = await ownerGuard(id);
  const res = await transitionCampaign({
    campaignId: id,
    to: "pending_review",
    actor: "owner",
    actorUserId: uid,
  });
  if (!res.ok) redirect(`/painel/campanhas/${id}?erro=${encodeURIComponent(res.error)}`);
  revalidatePath(`/painel/campanhas/${id}`);
  redirect(`/painel/campanhas/${id}?ok=enviada`);
}

export async function withdrawSubmissionAction(formData: FormData) {
  const id = String(formData.get("campaignId") ?? "");
  const uid = await ownerGuard(id);
  await transitionCampaign({ campaignId: id, to: "draft", actor: "owner", actorUserId: uid });
  revalidatePath(`/painel/campanhas/${id}`);
  redirect(`/painel/campanhas/${id}`);
}

export async function pauseCampaignAction(formData: FormData) {
  const id = String(formData.get("campaignId") ?? "");
  const uid = await ownerGuard(id);
  await transitionCampaign({ campaignId: id, to: "paused", actor: "owner", actorUserId: uid });
  revalidatePath(`/painel/campanhas/${id}`);
  redirect(`/painel/campanhas/${id}`);
}

export async function resumeCampaignAction(formData: FormData) {
  const id = String(formData.get("campaignId") ?? "");
  const uid = await ownerGuard(id);
  await transitionCampaign({ campaignId: id, to: "active", actor: "owner", actorUserId: uid });
  revalidatePath(`/painel/campanhas/${id}`);
  redirect(`/painel/campanhas/${id}`);
}

export async function completeCampaignAction(formData: FormData) {
  const id = String(formData.get("campaignId") ?? "");
  const uid = await ownerGuard(id);
  await transitionCampaign({ campaignId: id, to: "completed", actor: "owner", actorUserId: uid });
  revalidatePath(`/painel/campanhas/${id}`);
  redirect(`/painel/campanhas/${id}`);
}

export async function archiveCampaignAction(formData: FormData) {
  const id = String(formData.get("campaignId") ?? "");
  const uid = await ownerGuard(id);
  await transitionCampaign({ campaignId: id, to: "archived", actor: "owner", actorUserId: uid });
  revalidatePath(`/painel/campanhas`);
  redirect(`/painel/campanhas`);
}

// ------------------------------------------------------------------
// Publicar atualização (doc §21.2)
// ------------------------------------------------------------------
export async function addUpdateAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  const parsed = campaignUpdateSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    publishNow: formData.get("publishNow") !== "false",
  });
  if (!parsed.success) {
    return { status: "error", message: "Revise a atualização.", fieldErrors: zErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("campaign_updates").insert({
    campaign_id: id,
    author_user_id: user.id,
    title: parsed.data.title,
    body: sanitizeRichText(parsed.data.body),
    published_at: parsed.data.publishNow ? new Date().toISOString() : null,
  });
  if (error) {
    return { status: "error", message: "Não foi possível publicar a atualização." };
  }
  await writeAuditLog({
    actorUserId: user.id,
    action: "campaign.update_posted",
    entityType: "campaign",
    entityId: id,
  });
  revalidatePath(`/painel/campanhas/${id}`);
  return { status: "success", message: "Atualização publicada." };
}

// ------------------------------------------------------------------
// Upload de imagem (doc §34.6)
// ------------------------------------------------------------------
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Núcleo do upload de imagem de campanha: valida tamanho, MIME, magic bytes e
 * posse, envia ao storage e grava `campaign_media`. Define a capa se ainda não
 * houver. Compartilhado entre o gerenciador de mídia e o wizard de criação.
 */
async function storeCampaignImage(opts: {
  userId: string;
  campaignId: string;
  file: unknown;
}): Promise<{ ok: true; mediaId: string } | { ok: false; message: string }> {
  const { userId, campaignId: id, file } = opts;
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Selecione uma imagem." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Imagem acima de 5 MB." };
  }
  const ext = extForMime(file.type);
  if (!ext) {
    return { ok: false, message: "Formato inválido. Use JPG, PNG ou WebP." };
  }

  // Confere assinatura (magic bytes) — não confiar só no Content-Type.
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
    return { ok: false, message: "O arquivo não parece ser uma imagem válida." };
  }

  // Confirma posse da campanha.
  const admin = createAdminClient();
  const { data: camp } = await admin
    .from("campaigns")
    .select("owner_user_id, cover_media_id")
    .eq("id", id)
    .maybeSingle();
  if (!camp || camp.owner_user_id !== userId) {
    return { ok: false, message: "Campanha inválida." };
  }

  const storage = await getStorageProvider();
  const key = randomAssetKey(id, ext);
  let put;
  try {
    put = await storage.put({ key, body: bytes, contentType: file.type });
  } catch {
    return { ok: false, message: "Falha no upload. Tente novamente." };
  }

  const supabase = await createClient();
  const { data: media, error } = await supabase
    .from("campaign_media")
    .insert({
      campaign_id: id,
      kind: "image",
      storage_provider: put.provider,
      storage_key: put.key,
      public_url: put.publicUrl,
      byte_size: file.size,
    })
    .select("id")
    .single();
  if (error || !media) {
    await storage.remove(key).catch(() => {});
    return { ok: false, message: "Não foi possível salvar a imagem." };
  }

  if (!camp.cover_media_id) {
    await setCampaignCover({ campaignId: id, mediaId: media.id, actorUserId: userId });
  }
  return { ok: true, mediaId: media.id };
}

/** Lista a mídia da campanha para o dono (com marcação de capa). */
async function listOwnedCampaignMedia(
  campaignId: string,
  userId: string,
): Promise<CampaignMediaLite[]> {
  const admin = createAdminClient();
  const { data: camp } = await admin
    .from("campaigns")
    .select("owner_user_id, cover_media_id")
    .eq("id", campaignId)
    .maybeSingle();
  if (!camp || camp.owner_user_id !== userId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_media")
    .select("id, public_url")
    .eq("campaign_id", campaignId)
    .order("position");
  return (data ?? []).map((m) => ({
    id: m.id,
    public_url: m.public_url,
    isCover: m.id === camp.cover_media_id,
  }));
}

export async function uploadCampaignImageAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  const res = await storeCampaignImage({
    userId: user.id,
    campaignId: id,
    file: formData.get("file"),
  });
  if (!res.ok) return { status: "error", message: res.message };

  revalidatePath(`/painel/campanhas/${id}`);
  return { status: "success", message: "Imagem enviada." };
}

export async function deleteCampaignImageAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  const mediaId = String(formData.get("mediaId") ?? "");
  const admin = createAdminClient();
  const { data: camp } = await admin
    .from("campaigns")
    .select("owner_user_id, cover_media_id")
    .eq("id", id)
    .maybeSingle();
  if (!camp || camp.owner_user_id !== user.id) redirect(`/painel/campanhas/${id}`);

  const { data: media } = await admin
    .from("campaign_media")
    .select("storage_key")
    .eq("id", mediaId)
    .eq("campaign_id", id)
    .maybeSingle();

  const supabase = await createClient();
  await supabase.from("campaign_media").delete().eq("id", mediaId);
  if (media) {
    const storage = await getStorageProvider();
    await storage.remove(media.storage_key).catch(() => {});
  }
  if (camp.cover_media_id === mediaId) {
    await setCampaignCover({ campaignId: id, mediaId: null, actorUserId: user.id });
  }
  revalidatePath(`/painel/campanhas/${id}`);
  redirect(`/painel/campanhas/${id}`);
}

export async function setCoverAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  const mediaId = String(formData.get("mediaId") ?? "");
  const admin = createAdminClient();
  const { data: camp } = await admin
    .from("campaigns")
    .select("owner_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!camp || camp.owner_user_id !== user.id) redirect(`/painel/campanhas/${id}`);
  await setCampaignCover({ campaignId: id, mediaId, actorUserId: user.id });
  revalidatePath(`/painel/campanhas/${id}`);
  redirect(`/painel/campanhas/${id}`);
}

// ==================================================================
// Wizard de criação de campanha (assistente em etapas no painel)
//
// Reaproveita exatamente o mesmo schema, slug, sanitização, storage e
// máquina de estados das ações acima. A diferença é que estas retornam
// o estado (com id/slug/mídia) em vez de redirecionar, para o assistente
// client-side avançar de etapa sem perder o progresso.
// ==================================================================

/** Cria o rascunho e devolve o id/slug (não redireciona). */
export async function createCampaignDraftAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser("/painel/campanhas/nova");

  const rl = rateLimit(`campaign-create:${user.id}`, {
    limit: 10,
    windowSeconds: 3600,
  });
  if (!rl.ok) {
    return { status: "error", message: "Muitas campanhas criadas. Tente mais tarde." };
  }

  const parsed = campaignDraftSchema.safeParse({
    title: formData.get("title"),
    categorySlug: formData.get("categorySlug"),
    summary: formData.get("summary"),
    story: formData.get("story") ?? "",
    goalAmount: formData.get("goalAmount"),
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: zErrors(parsed.error),
    };
  }
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("campaigns")
    .select("slug")
    .ilike("slug", `${input.title.slice(0, 40)}%`);
  const slug = ensureUniqueSlug(
    input.title,
    (existing ?? []).map((r) => r.slug),
  );

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("campaigns")
    .insert({
      owner_user_id: user.id,
      title: input.title,
      slug,
      summary: input.summary,
      story: sanitizeRichText(input.story),
      category_id: await resolveCategoryId(input.categorySlug),
      goal_amount_cents: input.goalAmount,
      city: input.city || null,
      state: input.state || null,
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error || !created) {
    return { status: "error", message: "Não foi possível criar a campanha." };
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "campaign.create",
    entityType: "campaign",
    entityId: created.id,
    after: { slug: created.slug, goal_amount_cents: input.goalAmount },
  });

  revalidatePath("/painel/campanhas");
  return {
    status: "success",
    campaignId: created.id,
    slug: created.slug,
    message: "Rascunho criado.",
  };
}

/** Imagem: envia e devolve a lista atualizada de mídia da campanha. */
export async function wizardUploadImageAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  if (!id) return { status: "error", message: "Campanha inválida." };

  const res = await storeCampaignImage({
    userId: user.id,
    campaignId: id,
    file: formData.get("file"),
  });
  const media = await listOwnedCampaignMedia(id, user.id);
  if (!res.ok) return { status: "error", message: res.message, campaignId: id, media };

  revalidatePath(`/painel/campanhas/${id}`);
  return { status: "success", message: "Imagem enviada.", campaignId: id, media };
}

/** Imagem: remove e devolve a lista atualizada. */
export async function wizardRemoveImageAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  const mediaId = String(formData.get("mediaId") ?? "");

  const admin = createAdminClient();
  const { data: camp } = await admin
    .from("campaigns")
    .select("owner_user_id, cover_media_id")
    .eq("id", id)
    .maybeSingle();
  if (!camp || camp.owner_user_id !== user.id) {
    return { status: "error", message: "Campanha inválida." };
  }

  const { data: mediaRow } = await admin
    .from("campaign_media")
    .select("storage_key")
    .eq("id", mediaId)
    .eq("campaign_id", id)
    .maybeSingle();

  const supabase = await createClient();
  await supabase.from("campaign_media").delete().eq("id", mediaId);
  if (mediaRow) {
    const storage = await getStorageProvider();
    await storage.remove(mediaRow.storage_key).catch(() => {});
  }
  if (camp.cover_media_id === mediaId) {
    await setCampaignCover({ campaignId: id, mediaId: null, actorUserId: user.id });
  }

  revalidatePath(`/painel/campanhas/${id}`);
  return {
    status: "success",
    campaignId: id,
    media: await listOwnedCampaignMedia(id, user.id),
  };
}

/** Imagem: define a capa e devolve a lista atualizada. */
export async function wizardSetCoverAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  const mediaId = String(formData.get("mediaId") ?? "");

  const admin = createAdminClient();
  const { data: camp } = await admin
    .from("campaigns")
    .select("owner_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!camp || camp.owner_user_id !== user.id) {
    return { status: "error", message: "Campanha inválida." };
  }
  await setCampaignCover({ campaignId: id, mediaId, actorUserId: user.id });

  revalidatePath(`/painel/campanhas/${id}`);
  return {
    status: "success",
    campaignId: id,
    media: await listOwnedCampaignMedia(id, user.id),
  };
}

/** Hidrata a lista de mídia (usado ao entrar na etapa de imagens). */
export async function wizardMediaAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  if (!id) return { status: "error", message: "Campanha inválida." };
  return {
    status: "success",
    campaignId: id,
    media: await listOwnedCampaignMedia(id, user.id),
  };
}

/** Envia o rascunho para análise (draft → pending_review) sem redirecionar. */
export async function wizardSubmitForReviewAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  const id = String(formData.get("campaignId") ?? "");
  if (!id) return { status: "error", message: "Campanha inválida." };

  const admin = createAdminClient();
  const { data: camp } = await admin
    .from("campaigns")
    .select("owner_user_id, slug")
    .eq("id", id)
    .maybeSingle();
  if (!camp || camp.owner_user_id !== user.id) {
    return { status: "error", message: "Campanha inválida." };
  }

  const res = await transitionCampaign({
    campaignId: id,
    to: "pending_review",
    actor: "owner",
    actorUserId: user.id,
  });
  if (!res.ok) {
    return { status: "error", message: res.error, campaignId: id, slug: camp.slug };
  }

  revalidatePath(`/painel/campanhas/${id}`);
  revalidatePath("/painel/campanhas");
  return {
    status: "success",
    campaignId: id,
    slug: camp.slug,
    message: "Campanha enviada para análise.",
  };
}
