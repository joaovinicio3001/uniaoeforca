import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Destino dos links de e-mail do Supabase Auth (confirmação de cadastro,
 * recuperação de senha, magic link). Aceita tanto o fluxo `token_hash` + `type`
 * quanto o `code` (PKCE). Regra da doc §8.3 vale para dinheiro, não para auth —
 * aqui a confirmação vem do provedor de identidade via token assinado.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/painel";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/painel";

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(
    `${origin}/login?erro=link-invalido`,
  );
}
