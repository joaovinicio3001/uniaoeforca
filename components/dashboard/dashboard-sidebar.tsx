"use client";

import { usePathname } from "next/navigation";

import { PAINEL_NAV, isNavActive } from "@/components/dashboard/nav";
import { SidebarItem } from "@/components/dashboard/sidebar-item";
import { HelpCard } from "@/components/dashboard/help-card";

/** Sidebar do painel (desktop). É um card flutuante, não encosta nas bordas. */
export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[248px] shrink-0 md:block lg:w-[280px] xl:w-[305px]">
      <div className="sticky top-24 flex flex-col gap-2 rounded-[18px] border border-[#E0E7F1] bg-white p-3.5 shadow-[0_5px_20px_rgba(30,60,120,0.06)]">
        <nav className="flex flex-col gap-1">
          {PAINEL_NAV.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              active={isNavActive(pathname, item.href)}
            />
          ))}
        </nav>
        <HelpCard className="mt-2" />
      </div>
    </aside>
  );
}
