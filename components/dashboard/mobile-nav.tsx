"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/(auth)/actions";
import { PAINEL_NAV, isNavActive } from "@/components/dashboard/nav";
import { SidebarItem } from "@/components/dashboard/sidebar-item";

/** Botão hambúrguer + drawer lateral do painel no celular. */
export function MobileNav({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Fecha ao trocar de rota.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape + trava o scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-[10px] border border-[#DCE5F2] bg-white text-[#17315C] transition-colors hover:bg-[#F5F8FE]"
      >
        <Menu className="size-5" />
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-[#071D4A]/40 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu do painel"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-[320px] flex-col bg-white shadow-[0_0_40px_rgba(7,29,74,0.25)] transition-transform duration-300 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-[#E7EDF6] px-4 py-3.5">
          <span className="text-sm font-semibold text-[#071D4A]">Menu</span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="flex size-11 items-center justify-center rounded-[10px] text-[#5B6B88] transition-colors hover:bg-[#F5F8FE]"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {PAINEL_NAV.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              active={isNavActive(pathname, item.href)}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>

        <div className="border-t border-[#E7EDF6] p-4">
          <p className="text-sm font-semibold text-[#071D4A]">{userName}</p>
          <form action={signOutAction} className="mt-3">
            <button
              type="submit"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#DCE5F2] bg-white px-4 text-sm font-medium text-[#17315C] transition-colors hover:bg-[#F5F8FE]"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
