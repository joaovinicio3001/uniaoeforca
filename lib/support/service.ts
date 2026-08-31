import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/security/audit";
import { notifyUser } from "@/lib/notifications/service";
import type { TicketCategory, TicketStatus } from "@/lib/support/shared";

export type { TicketCategory, TicketStatus } from "@/lib/support/shared";
export {
  TICKET_CATEGORIES,
  TICKET_STATUS_LABEL,
  TICKET_CATEGORY_LABEL,
} from "@/lib/support/shared";

// ---------- usuário ----------
export async function createTicket(params: {
  userId: string;
  subject: string;
  category: TicketCategory;
  body: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: params.userId,
      subject: params.subject,
      category: params.category,
    })
    .select("id")
    .single();
  if (error || !ticket) {
    return { ok: false, error: "Não foi possível abrir o chamado." };
  }

  await supabase.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    author_user_id: params.userId,
    is_staff: false,
    body: params.body,
  });

  await writeAuditLog({
    actorUserId: params.userId,
    action: "support.ticket_opened",
    entityType: "support_ticket",
    entityId: ticket.id,
    after: { category: params.category },
  });

  return { ok: true, id: ticket.id };
}

export async function replyAsUser(params: {
  userId: string;
  ticketId: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, status")
    .eq("id", params.ticketId)
    .maybeSingle();
  if (!ticket) return { ok: false, error: "Chamado não encontrado." };
  if (ticket.status === "closed") {
    return { ok: false, error: "Este chamado está fechado." };
  }

  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: params.ticketId,
    author_user_id: params.userId,
    is_staff: false,
    body: params.body,
  });
  if (error) return { ok: false, error: "Não foi possível enviar a mensagem." };

  // Reabre o chamado para a fila da equipe.
  if (hasServiceRole()) {
    await createAdminClient()
      .from("support_tickets")
      .update({
        status: "open",
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.ticketId);
  }
  return { ok: true };
}

export async function listMyTickets(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, last_message_at, created_at")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });
  return data ?? [];
}

export async function getMyTicket(userId: string, ticketId: string) {
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!ticket) return null;
  const { data: messages } = await supabase
    .from("support_ticket_messages")
    .select("id, is_staff, body, created_at, author_user_id")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return { ticket, messages: messages ?? [] };
}

// ---------- staff ----------
export async function listAllTickets(status?: TicketStatus) {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  let q = admin
    .from("support_tickets")
    .select("id, user_id, subject, category, status, last_message_at, created_at")
    .order("last_message_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data ?? [];
}

export async function getTicketForStaff(ticketId: string) {
  if (!hasServiceRole()) return null;
  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return null;

  const [{ data: messages }, { data: profile }, authRes] = await Promise.all([
    admin
      .from("support_ticket_messages")
      .select("id, is_staff, body, created_at, author_user_id")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", ticket.user_id)
      .maybeSingle(),
    admin.auth.admin.getUserById(ticket.user_id),
  ]);

  return {
    ticket,
    messages: messages ?? [],
    requester: {
      name: profile?.full_name ?? "—",
      email: authRes.data?.user?.email ?? null,
    },
  };
}

export async function replyAsStaff(params: {
  staffId: string;
  ticketId: string;
  body: string;
  newStatus?: TicketStatus;
}): Promise<{ ok: boolean; error?: string }> {
  if (!hasServiceRole()) return { ok: false, error: "service_role ausente." };
  const admin = createAdminClient();

  const { data: ticket } = await admin
    .from("support_tickets")
    .select("user_id")
    .eq("id", params.ticketId)
    .maybeSingle();
  if (!ticket) return { ok: false, error: "Chamado não encontrado." };

  const { error } = await admin.from("support_ticket_messages").insert({
    ticket_id: params.ticketId,
    author_user_id: params.staffId,
    is_staff: true,
    body: params.body,
  });
  if (error) return { ok: false, error: "Não foi possível enviar a resposta." };

  await admin
    .from("support_tickets")
    .update({
      status: params.newStatus ?? "waiting_user",
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.ticketId);

  await writeAuditLog({
    actorUserId: params.staffId,
    action: "support.ticket_replied",
    entityType: "support_ticket",
    entityId: params.ticketId,
    after: { status: params.newStatus ?? "waiting_user" },
  });

  await notifyUser(ticket.user_id, "support_reply", {
    ticket_id: params.ticketId,
  });
  return { ok: true };
}

export async function setTicketStatus(params: {
  staffId: string;
  ticketId: string;
  status: TicketStatus;
}): Promise<{ ok: boolean }> {
  if (!hasServiceRole()) return { ok: false };
  const admin = createAdminClient();
  await admin
    .from("support_tickets")
    .update({ status: params.status, updated_at: new Date().toISOString() })
    .eq("id", params.ticketId);
  await writeAuditLog({
    actorUserId: params.staffId,
    action: "support.ticket_status",
    entityType: "support_ticket",
    entityId: params.ticketId,
    after: { status: params.status },
  });
  return { ok: true };
}

export async function countOpenTickets(): Promise<number> {
  if (!hasServiceRole()) return 0;
  const { count } = await createAdminClient()
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "waiting_user"]);
  return count ?? 0;
}
