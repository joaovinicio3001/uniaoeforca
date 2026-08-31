import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Subdomínio de anúncios (lp.uniaoeforca.com.br): a raiz serve a landing page
  // de conversão, preservando a query (utm/fbclid/gclid).
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("lp.") && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/crie-sua-campanha";
    return NextResponse.rewrite(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, menos assets estáticos e imagens do Next.
     * Inclui as rotas protegidas /painel e /admin (guardas em updateSession).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
