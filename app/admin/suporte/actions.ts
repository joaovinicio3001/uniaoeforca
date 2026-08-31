"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/session";
import { replyAsStaff, setTicketStatus } from "@/lib/support/service";
import type { TicketStatus } from "@/lib/support/shared";

const STATUSES: TicketStatus[] = ["open", "waiting_user", "resolved", "closed"];

export async function staffReplyAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "");

  if (body.length < 2) redirect(`/admin/suporte/${id}?erro=vazio`);
  const newStatus = STATUSES.includes(rawStatus as TicketStatus)
    ? (rawStatus as TicketStatus)
    : undefined;

  const r = await replyAsStaff({
    staffId: staff.id,
    ticketId: id,
    body,
    newStatus,
  });
  revalidatePath(`/admin/suporte/${id}`);
  redirect(r.ok ? `/admin/suporte/${id}?ok=1` : `/admin/suporte/${id}?erro=falha`);
}

export async function staffSetStatusAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("ticketId") ?? "");
  const rawStatus = String(formData.get("status") ?? "");
  if (STATUSES.includes(rawStatus as TicketStatus)) {
    await setTicketStatus({
      staffId: staff.id,
      ticketId: id,
      status: rawStatus as TicketStatus,
    });
  }
  revalidatePath(`/admin/suporte/${id}`);
  redirect(`/admin/suporte/${id}?ok=1`);
}
