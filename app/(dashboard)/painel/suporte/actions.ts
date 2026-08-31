"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { createTicket, replyAsUser } from "@/lib/support/service";
import { TICKET_CATEGORIES, type TicketCategory } from "@/lib/support/shared";

export type SupportFormState = { status: "idle" | "error"; message?: string };

export async function createTicketAction(
  _prev: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  const user = await requireUser();
  const rl = rateLimit(`support-open:${user.id}`, {
    limit: 5,
    windowSeconds: 3600,
  });
  if (!rl.ok) {
    return {
      status: "error",
      message: "Você abriu muitos chamados. Tente novamente mais tarde.",
    };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const rawCat = String(formData.get("category") ?? "outro");
  const body = String(formData.get("body") ?? "").trim();

  if (subject.length < 4) {
    return { status: "error", message: "Descreva o assunto (mín. 4 caracteres)." };
  }
  if (body.length < 10) {
    return {
      status: "error",
      message: "Conte o que está acontecendo (mín. 10 caracteres).",
    };
  }

  const category: TicketCategory = TICKET_CATEGORIES.some(
    (c) => c.value === rawCat,
  )
    ? (rawCat as TicketCategory)
    : "outro";

  const r = await createTicket({ userId: user.id, subject, category, body });
  if (!r.ok || !r.id) {
    return { status: "error", message: r.error ?? "Não foi possível abrir o chamado." };
  }
  redirect(`/painel/suporte/${r.id}`);
}

export async function replyTicketAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (body.length < 2) redirect(`/painel/suporte/${id}?erro=vazio`);
  const rl = rateLimit(`support-reply:${user.id}`, {
    limit: 20,
    windowSeconds: 600,
  });
  if (!rl.ok) redirect(`/painel/suporte/${id}?erro=limite`);

  const r = await replyAsUser({ userId: user.id, ticketId: id, body });
  revalidatePath(`/painel/suporte/${id}`);
  redirect(r.ok ? `/painel/suporte/${id}` : `/painel/suporte/${id}?erro=falha`);
}
