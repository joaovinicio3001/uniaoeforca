import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";

export const REPORT_TYPES = [
  "donations",
  "withdrawals",
  "campaigns",
  "users",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_LABEL: Record<ReportType, string> = {
  donations: "Doações",
  withdrawals: "Saques",
  campaigns: "Campanhas",
  users: "Usuários",
};

export type ReportData = {
  columns: string[];
  rows: (string | number)[][];
};

const reais = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toFixed(2).replace(".", ",");
const iso = (v: string | null | undefined) => (v ? v : "");

export async function buildReport(
  type: ReportType,
  fromISO: string,
  toISO: string,
): Promise<ReportData> {
  if (!hasServiceRole()) return { columns: [], rows: [] };
  const admin = createAdminClient();

  if (type === "donations") {
    const { data } = await admin
      .from("donations")
      .select(
        "created_at, paid_at, status, gross_amount_cents, platform_fee_cents, provider_fee_cents, net_amount_cents, anonymous, payment_method, campaigns(title)",
      )
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: true })
      .limit(20000);
    return {
      columns: [
        "criada_em",
        "paga_em",
        "campanha",
        "status",
        "bruto",
        "taxa_plataforma",
        "taxa_provedor",
        "liquido",
        "anonima",
        "metodo",
      ],
      rows: (data ?? []).map((d) => [
        iso(d.created_at),
        iso(d.paid_at),
        (d.campaigns as { title?: string } | null)?.title ?? "",
        d.status,
        reais(d.gross_amount_cents),
        reais(d.platform_fee_cents),
        reais(d.provider_fee_cents),
        reais(d.net_amount_cents),
        d.anonymous ? "sim" : "nao",
        d.payment_method ?? "",
      ]),
    };
  }

  if (type === "withdrawals") {
    const { data } = await admin
      .from("withdrawals")
      .select(
        "requested_at, paid_at, user_id, amount_cents, fee_cents, net_cents, status, rejection_reason, failure_reason",
      )
      .gte("requested_at", fromISO)
      .lte("requested_at", toISO)
      .order("requested_at", { ascending: true })
      .limit(20000);
    return {
      columns: [
        "solicitado_em",
        "pago_em",
        "usuario_id",
        "valor",
        "taxa",
        "liquido",
        "status",
        "motivo",
      ],
      rows: (data ?? []).map((w) => [
        iso(w.requested_at),
        iso(w.paid_at),
        w.user_id,
        reais(w.amount_cents),
        reais(w.fee_cents),
        reais(w.net_cents),
        w.status,
        w.rejection_reason ?? w.failure_reason ?? "",
      ]),
    };
  }

  if (type === "campaigns") {
    const { data } = await admin
      .from("campaigns")
      .select(
        "created_at, published_at, title, status, goal_amount_cents, raised_amount_cents, supporters_count, city, state",
      )
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: true })
      .limit(20000);
    return {
      columns: [
        "criada_em",
        "publicada_em",
        "titulo",
        "status",
        "meta",
        "arrecadado",
        "apoiadores",
        "cidade",
        "uf",
      ],
      rows: (data ?? []).map((c) => [
        iso(c.created_at),
        iso(c.published_at),
        c.title,
        c.status,
        reais(c.goal_amount_cents),
        reais(c.raised_amount_cents),
        c.supporters_count ?? 0,
        c.city ?? "",
        c.state ?? "",
      ]),
    };
  }

  // users
  const { data } = await admin
    .from("profiles")
    .select(
      "created_at, full_name, cpf_last3, status, address_city, address_state, terms_accepted_at",
    )
    .gte("created_at", fromISO)
    .lte("created_at", toISO)
    .order("created_at", { ascending: true })
    .limit(20000);
  return {
    columns: [
      "cadastro",
      "nome",
      "cpf_final",
      "status",
      "cidade",
      "uf",
      "termos_aceitos_em",
    ],
    rows: (data ?? []).map((p) => [
      iso(p.created_at),
      p.full_name ?? "",
      p.cpf_last3 ?? "",
      p.status,
      p.address_city ?? "",
      p.address_state ?? "",
      iso(p.terms_accepted_at),
    ]),
  };
}

/** CSV com separador ";" e BOM UTF-8 (compatível com Excel pt-BR). */
export function toCSV(data: ReportData): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    data.columns.map(esc).join(";"),
    ...data.rows.map((r) => r.map(esc).join(";")),
  ];
  return "﻿" + lines.join("\r\n");
}
