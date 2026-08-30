import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/env";
import {
  runPixOutReconciliation,
  runLedgerInternalReconciliation,
} from "@/lib/reconciliation/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) return false;
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Job diário de conciliação (Vercel Cron). Doc §29. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const [pixOut, ledger] = await Promise.all([
    runPixOutReconciliation().catch((e) => ({ error: String(e) })),
    runLedgerInternalReconciliation().catch((e) => ({ error: String(e) })),
  ]);
  return NextResponse.json({ ok: true, pixOut, ledger });
}
