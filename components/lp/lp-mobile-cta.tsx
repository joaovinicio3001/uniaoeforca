"use client";

import { useEffect, useState } from "react";

import { LpCta } from "@/components/lp/lp-cta";

/**
 * Barra de CTA fixa no rodapé, só no mobile e só depois que o usuário passa do
 * hero. Discreta, não cobre formulários (o formulário de cadastro fica em outra
 * rota).
 */
export function LpMobileCta({
  ctaHref,
  ctaLabel,
}: {
  ctaHref: string;
  ctaLabel: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#EAF0F8] bg-white/95 p-3 backdrop-blur-sm transition-transform duration-200 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <LpCta
        href={ctaHref}
        location="mobile_sticky"
        size="lg"
        className="w-full"
      >
        {ctaLabel}
      </LpCta>
    </div>
  );
}
