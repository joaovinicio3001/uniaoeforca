import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";

export async function PublicHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/campanhas" className="hover:text-foreground">
            Campanhas
          </Link>
          <Link href="/como-funciona" className="hover:text-foreground">
            Como funciona
          </Link>
          <Link href="/taxas" className="hover:text-foreground">
            Taxas
          </Link>
          <Link href="/seguranca" className="hover:text-foreground">
            Segurança
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link href="/painel">Meu painel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/cadastro">Criar conta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
