import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Quem já está logado não precisa ver login/cadastro.
  const user = await getSessionUser();
  if (user) redirect("/painel");

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-navy p-10 text-white lg:flex">
        <Link href="/" className="text-white">
          <Logo variant="light" />
        </Link>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Juntos fazemos a diferença.
          </h1>
          <p className="max-w-sm text-white/80">
            Crie campanhas de arrecadação, receba doações por PIX e acompanhe
            cada centavo com transparência e segurança.
          </p>
        </div>
        <p className="text-xs text-white/60">
          uniaoeforca.com.br
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
