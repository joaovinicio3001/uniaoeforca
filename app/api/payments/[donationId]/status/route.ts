import { NextResponse, type NextRequest } from "next/server";

import { rateLimit } from "@/lib/security/rate-limit";
import { refreshDonationStatus } from "@/lib/payments/donations";

export const dynamic = "force-dynamic";

/**
 * Consulta de status usada pelo polling da tela de pagamento.
 * Rede de segurança se o webhook atrasar (doc §8.2). Faz a reconferência
 * server-to-server com o provedor e aplica a confirmação idempotente.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ donationId: string }> },
) {
  const { donationId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(donationId)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Evita marretar o provedor: no máximo 1 verificação a cada 3s por doação.
  const rl = rateLimit(`pay-status:${donationId}`, { limit: 1, windowSeconds: 3 });
  if (!rl.ok) {
    return NextResponse.json({ status: "pending", throttled: true }, { status: 200 });
  }

  const { status } = await refreshDonationStatus(donationId);
  return NextResponse.json(
    { status },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
