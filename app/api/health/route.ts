import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Health check para deploy/monitoração (doc §26: "health checks").
 * Verifica processo + round-trip real ao Postgres via RPC health_check().
 */
export async function GET() {
  const startedAt = Date.now();
  let db: "ok" | "error" = "ok";

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("health_check");
    if (error || data !== "ok") db = "error";
  } catch {
    db = "error";
  }

  const body = {
    status: db === "ok" ? "healthy" : "degraded",
    checks: { process: "ok", database: db },
    latencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: db === "ok" ? 200 : 503 });
}
