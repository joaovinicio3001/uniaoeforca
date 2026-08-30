import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/env";
import { processPushinPayWebhook } from "@/lib/payments/donations";

export const dynamic = "force-dynamic";

/**
 * Webhook PIX In — Pushin Pay (doc §8.2, §8.4, §34.3).
 *
 * O Pushin Pay não documenta assinatura de webhook. Camadas de defesa:
 *  1. token secreto no path da URL registrada na cobrança (comparado em tempo constante);
 *  2. verificação server-to-server obrigatória (GET /transactions/{id}) antes de creditar;
 *  3. idempotência por UNIQUE(provider, event_id) em webhook_events.
 * O corpo recebido aqui é apenas o gatilho — nunca a fonte de verdade (doc §8.3).
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
  const expected = serverEnv().PUSHINPAY_WEBHOOK_SECRET;

  if (!expected || !safeEqual(decodeURIComponent(token), expected)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let body: unknown;
  const ct = request.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  const { result, http } = await processPushinPayWebhook(body);
  return NextResponse.json({ result }, { status: http });
}
