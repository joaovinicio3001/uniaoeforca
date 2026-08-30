import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Quem já está logado não precisa ver login/cadastro.
  const user = await getSessionUser();
  if (user) redirect("/painel");

  return (
    <div className="relative grid min-h-dvh bg-brand-surface lg:grid-cols-2">
      {/* Painel com foto (desktop) */}
      <div className="relative hidden lg:block">
        <Image
          src="/auth-bg.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-brand-navy/10 to-brand-navy/30" />
      </div>

      {/* Fundo com foto (celular) */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="/auth-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-surface/90 backdrop-blur-sm" />
      </div>

      {/* Formulário */}
      <div className="relative flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden">
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
