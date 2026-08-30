import { NextResponse, type NextRequest } from "next/server";

import { rateLimit } from "@/lib/security/rate-limit";
import { reportError } from "@/lib/observability/report";

export const dynamic = "force-dynamic";

/** Recebe erros do client (global-error) e encaminha ao reporte server-side. */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`client-error:${ip}`, { limit: 20, windowSeconds: 60 }).ok) {
    return NextResponse.json({ ok: true });
  }
  try {
    const body = (await request.json()) as {
      message?: string;
      digest?: string;
      url?: string;
    };
    await reportError(new Error(body.message ?? "client error"), {
      source: "client",
      digest: body.digest,
      url: body.url,
    });
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
