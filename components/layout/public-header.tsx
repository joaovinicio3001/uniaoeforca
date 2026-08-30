import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/campaigns/queries";

type MenuLink = { label: string; href: string; desc?: string };

const COMO_AJUDAR: MenuLink[] = [
  { label: "Encontrar uma campanha", href: "/campanhas", desc: "Explore causas ativas e apoie quem precisa" },
  { label: "Como doar", href: "/como-funciona", desc: "Passo a passo para contribuir por PIX" },
  { label: "Segurança para quem doa", href: "/seguranca", desc: "Como protegemos a sua doação" },
  { label: "Central de ajuda", href: "/ajuda", desc: "Perguntas frequentes e contato" },
];

const COMO_FUNCIONA: MenuLink[] = [
  { label: "Criar uma campanha", href: "/como-funciona", desc: "Do cadastro ao primeiro saque" },
  { label: "Taxas", href: "/taxas", desc: "Quanto custa — grátis para criar" },
  { label: "Regras de campanhas", href: "/politica-campanhas", desc: "O que é permitido na plataforma" },
  { label: "Segurança e antifraude", href: "/seguranca", desc: "Verificação, monitoramento e proteção" },
  { label: "Termos de Uso", href: "/termos" },
  { label: "Política de Privacidade", href: "/privacidade" },
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

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="União & Força — início">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Dropdown label="Como ajudar" items={COMO_AJUDAR} />
          <Dropdown label="Descubra" items={descubra} />
          <Dropdown label="Como funciona" items={COMO_FUNCIONA} />
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

      {/* Navegação em telas pequenas */}
      <details className="border-t md:hidden">
        <summary className="container flex cursor-pointer list-none items-center justify-between py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Menu
          <ChevronDown className="size-4" />
        </summary>
        <div className="container grid gap-1 pb-4 text-sm">
          {[...COMO_AJUDAR, ...descubra.slice(0, 2), ...COMO_FUNCIONA].map((l) => (
            <Link
              key={l.label + l.href}
              href={l.href}
              className="rounded-md px-2 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </details>
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
