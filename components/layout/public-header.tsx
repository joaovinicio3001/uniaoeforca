import Link from "next/link";
import { ArrowRight, ChevronDown, Menu, Search } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";

type MenuLink = { label: string; href: string; desc?: string };

const GROUPS: { title: string; items: MenuLink[] }[] = [
  {
    title: "Como ajudar",
    items: [
      { label: "Encontrar uma campanha", href: "/campanhas", desc: "Explore causas ativas e apoie quem precisa" },
      { label: "Como doar", href: "/como-doar", desc: "Passo a passo para contribuir por PIX" },
    ],
  },
  {
    title: "Descubra",
    items: [
      { label: "Todas as campanhas", href: "/campanhas", desc: "Veja tudo o que está acontecendo agora" },
      { label: "Buscar campanhas", href: "/buscar", desc: "Procure por nome, cidade ou causa" },
    ],
  },
  {
    title: "Como funciona",
    items: [
      { label: "Como criar uma campanha", href: "/como-funciona", desc: "Passo a passo completo, do rascunho ao saque" },
      { label: "Regras e segurança", href: "/regras-e-seguranca", desc: "O que é permitido, os custos e as proteções" },
      { label: "Central de ajuda", href: "/ajuda", desc: "Respostas rápidas para as dúvidas mais comuns" },
    ],
  },
];

export async function PublicHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="União & Força — início">
          <Logo />
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {GROUPS.map((g) => (
            <Dropdown key={g.title} label={g.title} items={g.items} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
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

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <Link
            href="/buscar"
            aria-label="Buscar campanhas"
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Search className="size-5" />
          </Link>
          <details className="group">
            <summary
              aria-label="Abrir menu"
              className="flex list-none cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground [&::-webkit-details-marker]:hidden"
            >
              <Menu className="size-5" />
            </summary>
            <div className="fixed inset-x-0 top-16 z-50 border-t bg-card shadow-lg">
              <div className="container max-h-[calc(100dvh-4rem)] overflow-y-auto py-2">
                {GROUPS.map((g) => (
                  <details key={g.title} className="group/sub border-b">
                    <summary className="flex list-none cursor-pointer items-center justify-between py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                      {g.title}
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/sub:rotate-180" />
                    </summary>
                    <div className="pb-2">
                      {g.items.map((it) => (
                        <Link
                          key={it.label + it.href}
                          href={it.href}
                          className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}

                <Link
                  href={user ? "/painel" : "/login"}
                  className="flex items-center justify-between border-b py-4 text-sm font-medium text-primary"
                >
                  {user ? "Meu painel" : "Minha conta"}
                  <ArrowRight className="size-4" />
                </Link>

                <div className="py-4">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/cadastro">Criar minha campanha</Link>
                  </Button>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function Dropdown({ label, items }: { label: string; items: MenuLink[] }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground group-hover:text-foreground group-focus-within:text-foreground"
      >
        {label}
        <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 w-72 translate-y-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="mt-1 overflow-hidden rounded-xl border bg-card p-2 shadow-lg">
          {items.map((it) => (
            <Link
              key={it.label + it.href}
              href={it.href}
              className="block rounded-lg px-3 py-2 hover:bg-secondary"
            >
              <span className="block text-sm font-medium text-foreground">
                {it.label}
              </span>
              {it.desc && (
                <span className="block text-xs text-muted-foreground">
                  {it.desc}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
