import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { refreshPayoutStatus } from "@/lib/withdrawals/service";

export const dynamic = "force-dynamic";

/** Polling do status do saque na tela do usuário. RLS garante que só o dono lê. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: w } = await supabase
    .from("withdrawals")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!w) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Reconfirma no provedor no máximo 1x/5s enquanto está em processamento.
  if (w.status === "processing") {
    const rl = rateLimit(`payout-status:${id}`, { limit: 1, windowSeconds: 5 });
    if (rl.ok) await refreshPayoutStatus(id);
    const { data: fresh } = await supabase
      .from("withdrawals")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    return NextResponse.json(
      { status: fresh?.status ?? w.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { status: w.status },
    { headers: { "Cache-Control": "no-store" } },
  );
}
