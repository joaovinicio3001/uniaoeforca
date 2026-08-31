"use client";

import Link from "next/link";
import Image from "next/image";

import { LpCta } from "@/components/lp/lp-cta";

const NAV = [
  { id: "como-funciona", label: "Como funciona" },
  { id: "historias", label: "Histórias" },
  { id: "seguranca", label: "Segurança" },
  { id: "duvidas", label: "Dúvidas" },
];

export function LpHeader({
  ctaHref,
  ctaLabel,
  loginHref,
}: {
  ctaHref: string;
  ctaLabel: string;
  loginHref: string;
}) {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#EAF0F8] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Página inicial da União & Força" className="shrink-0">
          <Image
            src="/logo-lockup.png"
            alt="União &amp; Força"
            width={1716}
            height={829}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={scrollTo(n.id)}
              className="text-sm font-medium text-[#5B6B88] transition-colors hover:text-[#071D4A]"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={loginHref}
            className="hidden rounded-[11px] px-3 py-2 text-sm font-semibold text-[#071D4A] transition-colors hover:bg-[#F2F6FC] sm:inline-flex"
          >
            Entrar
          </Link>
          <LpCta href={ctaHref} location="header" size="md" arrow={false}>
            {ctaLabel}
          </LpCta>
        </div>
      </div>
    </header>
  );
}
