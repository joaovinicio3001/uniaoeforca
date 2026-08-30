import Link from "next/link";
import { ChevronDown, Menu, Search } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/campaigns/queries";

type MenuLink = { label: string; href: string; desc?: string };

const COMO_AJUDAR: MenuLink[] = [
  { label: "Encontrar uma campanha", href: "/campanhas", desc: "Explore causas ativas e apoie quem precisa" },
  { label: "Como doar", href: "/como-funciona", desc: "Passo a passo para contribuir por PIX" },
  { label: "Regras e segurança", href: "/regras-e-seguranca", desc: "Como protegemos a sua doação" },
  { label: "Central de ajuda", href: "/ajuda", desc: "Perguntas frequentes e contato" },
];

const COMO_FUNCIONA: MenuLink[] = [
  { label: "Como criar uma campanha", href: "/como-funciona", desc: "Passo a passo completo, do rascunho ao saque" },
  { label: "Custos", href: "/custos", desc: "Tudo o que você paga — e o que é grátis" },
  { label: "Regras e segurança", href: "/regras-e-seguranca", desc: "O que é permitido e como protegemos todo mundo" },
];

export async function PublicHeader() {
  const [user, categories] = await Promise.all([
    getSessionUser(),
    listCategories().catch(() => []),
  ]);

  const descubra: MenuLink[] = [
    { label: "Todas as campanhas", href: "/campanhas", desc: "Veja tudo o que está acontecendo agora" },
    { label: "Buscar campanha", href: "/buscar", desc: "Procure por nome, cidade ou causa" },
    ...categories.slice(0, 8).map((c) => ({
      label: c.name,
      href: `/campanhas?categoria=${c.slug}`,
    })),
  ];

  const groups: { title: string; items: MenuLink[] }[] = [
    { title: "Como ajudar", items: COMO_AJUDAR },
    { title: "Descubra", items: descubra },
    { title: "Como funciona", items: COMO_FUNCIONA },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="União & Força — início">
          <Logo />
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {groups.map((g) => (
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
              <div className="container max-h-[calc(100dvh-4rem)] overflow-y-auto py-4">
                {groups.map((g) => (
                  <div key={g.title} className="border-b py-3 first:pt-0 last:border-b-0">
                    <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.title}
                    </p>
                    {g.items.map((it) => (
                      <Link
                        key={it.label + it.href}
                        href={it.href}
                        className="block rounded-lg px-1 py-2 hover:bg-secondary"
                      >
                        <span className="block text-sm font-medium">{it.label}</span>
                        {it.desc && (
                          <span className="block text-xs text-muted-foreground">
                            {it.desc}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                ))}
                <div className="flex flex-col gap-2 pt-4">
                  {user ? (
                    <Button asChild>
                      <Link href="/painel">Meu painel</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline">
                        <Link href="/login">Entrar</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/cadastro">Criar conta</Link>
                      </Button>
                    </>
                  )}
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
