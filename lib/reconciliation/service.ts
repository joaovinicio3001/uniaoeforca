import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/security/audit";
import { getPixInProvider } from "@/lib/payments";
import { getPixOutProvider } from "@/lib/payments/pixout";

type RunResult = { runId: string; checked: number; divergences: number };

async function startRun(kind: "pix_in" | "pix_out" | "ledger_internal", provider?: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("reconciliation_runs")
    .insert({ kind, provider })
    .select("id")
    .single();
  return data!.id as string;
}

async function finishRun(runId: string, checked: number, divergences: number, error?: string) {
  const admin = createAdminClient();
  await admin
    .from("reconciliation_runs")
    .update({
      items_checked: checked,
      divergences,
      status: error ? "error" : "done",
      error: error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

/** PIX In: confere status + valor de cada pagamento pago recente contra o provedor. */
export async function runPixInReconciliation(sinceHours = 48): Promise<RunResult> {
  const admin = createAdminClient();
  const provider = getPixInProvider();
  const runId = await startRun("pix_in", provider.name);
  let checked = 0;
  let div = 0;
  try {
    const { data: payments } = await admin
      .from("payments")
      .select("id, provider, provider_reference, amount_cents, status")
      .eq("provider", provider.name)
      .eq("status", "paid")
      .gte("paid_at", new Date(Date.now() - sinceHours * 3600e3).toISOString());

    for (const p of payments ?? []) {
      if (!p.provider_reference) continue;
      checked++;
      try {
        const charge = await provider.getCharge(p.provider_reference);
        const amountOk =
          !Number.isFinite(charge.amountCents) || charge.amountCents === p.amount_cents;
        const statusOk = charge.status === "paid";
        if (!amountOk || !statusOk) {
          div++;
          await admin.from("reconciliation_items").insert({
            run_id: runId,
            kind: "pix_in",
            provider: p.provider,
            external_reference: p.provider_reference,
            internal_reference: p.id,
            amount_expected_cents: p.amount_cents,
            amount_actual_cents: Number.isFinite(charge.amountCents) ? charge.amountCents : null,
            status: "divergent",
            details: { provider_status: charge.status, internal_status: p.status },
          });
        }
      } catch (e) {
        div++;
        await admin.from("reconciliation_items").insert({
          run_id: runId,
          kind: "pix_in",
          provider: p.provider,
          external_reference: p.provider_reference,
          internal_reference: p.id,
          status: "missing_external",
          details: { error: (e as Error).message.slice(0, 200) },
        });
      }
    }
    await finishRun(runId, checked, div);
  } catch (e) {
    await finishRun(runId, checked, div, (e as Error).message);
  }
  return { runId, checked, divergences: div };
}

/** PIX Out: confere status + valor líquido + registra o gatewayFee real da GGPix. */
export async function runPixOutReconciliation(sinceHours = 168): Promise<RunResult> {
  const admin = createAdminClient();
  const provider = getPixOutProvider();
  const runId = await startRun("pix_out", provider.name);
  let checked = 0;
  let div = 0;
  try {
    const { data: payouts } = await admin
      .from("provider_payouts")
      .select("id, withdrawal_id, provider, provider_reference, status, external_fee_cents")
      .gte("requested_at", new Date(Date.now() - sinceHours * 3600e3).toISOString());

    for (const po of payouts ?? []) {
      if (!po.provider_reference || provider.isMock) continue;
      checked++;
      try {
        const st = await provider.getPayout(po.provider_reference);
        const { data: w } = await admin
          .from("withdrawals")
          .select("net_cents, status")
          .eq("id", po.withdrawal_id)
          .maybeSingle();

        const netOk =
          st.netAmountCents == null || !w || st.netAmountCents === w.net_cents;
        const feeChanged =
          st.feeCents != null && st.feeCents !== (po.external_fee_cents ?? null);
        const statusMap: Record<string, string> = {
          complete: "paid",
          failed: "failed",
          canceled: "failed",
          pending: "pending",
        };
        const statusOk = !w || statusMap[st.status] === w.status || w.status === "processing";

        if (feeChanged) {
          await admin
            .from("provider_payouts")
            .update({ external_fee_cents: st.feeCents })
            .eq("id", po.id);
        }
        if (!netOk || !statusOk || feeChanged) {
          div++;
          await admin.from("reconciliation_items").insert({
            run_id: runId,
            kind: "pix_out",
            provider: po.provider,
            external_reference: po.provider_reference,
            internal_reference: po.withdrawal_id,
            amount_expected_cents: w?.net_cents ?? null,
            amount_actual_cents: st.netAmountCents,
            status: feeChanged && netOk && statusOk ? "matched" : "divergent",
            details: {
              provider_status: st.status,
              internal_status: w?.status,
              gateway_fee_cents: st.feeCents,
              previous_fee_cents: po.external_fee_cents,
            },
          });
        }
      } catch (e) {
        div++;
        await admin.from("reconciliation_items").insert({
          run_id: runId,
          kind: "pix_out",
          provider: po.provider,
          external_reference: po.provider_reference,
          internal_reference: po.withdrawal_id,
          status: "missing_external",
          details: { error: (e as Error).message.slice(0, 200) },
        });
      }
    }
    await finishRun(runId, checked, div);
  } catch (e) {
    await finishRun(runId, checked, div, (e as Error).message);
  }
  return { runId, checked, divergences: div };
}

export async function runLedgerInternalReconciliation(): Promise<RunResult & { report: unknown }> {
  const admin = createAdminClient();
  const runId = await startRun("ledger_internal");
  const { data } = await admin.rpc("reconcile_ledger_internal", { p_run_id: runId });
  const report = data as { divergences?: number };
  await finishRun(runId, 1, report?.divergences ?? 0);
  return { runId, checked: 1, divergences: report?.divergences ?? 0, report };
}

// ---------- leitura / resolução ----------
export async function listOpenReconItems(limit = 200) {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("reconciliation_items")
    .select("*")
    .not("status", "in", "(resolved,matched)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listReconRuns(limit = 20) {
  if (!hasServiceRole()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("reconciliation_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function resolveReconItem(params: {
  itemId: string;
  note: string;
  actorId: string;
}) {
  const admin = createAdminClient();
  await admin
    .from("reconciliation_items")
    .update({
      status: "resolved",
      resolution_note: params.note,
      resolved_by: params.actorId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.itemId);
  await writeAuditLog({
    actorUserId: params.actorId,
    action: "reconciliation.resolved",
    entityType: "reconciliation_item",
    entityId: params.itemId,
    after: { note: params.note },
  });
}
