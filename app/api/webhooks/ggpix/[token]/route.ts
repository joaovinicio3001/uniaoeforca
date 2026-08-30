import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/env";
import { processGGPixWebhook } from "@/lib/withdrawals/service";

export const dynamic = "force-dynamic";

/**
 * Webhook PIX Out — GGPix (doc §8.3, §34.4).
 * GGPix não documenta assinatura de webhook. Defesa: token secreto no path +
 * verificação server-to-server obrigatória (GET /transactions/{id}) antes de
 * marcar como pago/falho. Corpo recebido aqui é só gatilho.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const expected = serverEnv().GGPIX_WEBHOOK_SECRET;
  if (!expected || !safeEqual(decodeURIComponent(token), expected)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let body: unknown;
  const ct = request.headers.get("content-type") ?? "";
  try {
    body = ct.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  const { result, http } = await processGGPixWebhook(body);
  return NextResponse.json({ result }, { status: http });
}
