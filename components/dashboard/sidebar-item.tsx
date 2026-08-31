import Link from "next/link";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/dashboard/nav";

/** Um link da navegação do painel. Ativo = destaque azul; "em breve" = inerte. */
export function SidebarItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  const body = (
    <>
      <Icon className="size-[18px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.soon && (
        <span className="shrink-0 rounded-md border border-[#B9D0FF] bg-[#EAF2FF] px-1.5 py-0.5 text-[11px] font-medium text-[#1359E7]">
          em breve
        </span>
      )}
    </>
  );

  const base =
    "flex min-h-[52px] items-center gap-3 rounded-[14px] px-4 text-[15px] font-medium transition-colors";

  if (item.soon) {
    return (
      <span
        aria-disabled
        className={cn(base, "cursor-not-allowed text-[#8A99B5] opacity-80")}
      >
        {body}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#063CCB]/40",
        active
          ? "bg-gradient-to-r from-[#063CCB] to-[#1E5BE6] font-semibold text-white shadow-[0_8px_18px_rgba(6,60,203,0.28)]"
          : "text-[#17315C] hover:bg-[#F1F6FE]",
      )}
    >
      {body}
    </Link>
  );
}
