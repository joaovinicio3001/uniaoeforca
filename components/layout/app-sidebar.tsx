"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  HandCoins,
  Wallet,
  Banknote,
  Bell,
  UserRound,
  ShieldCheck,
  BadgeCheck,
  ShieldAlert,
  Scale,
  Lock,
  FileLock2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
};

const USER_NAV: Item[] = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { href: "/painel/campanhas", label: "Minhas campanhas", icon: Megaphone },
  { href: "/painel/contribuicoes", label: "Contribuições", icon: HandCoins },
  { href: "/painel/carteira", label: "Carteira", icon: Wallet },
  { href: "/painel/saques", label: "Saques", icon: Banknote },
  { href: "/painel/kyc", label: "Verificação", icon: BadgeCheck },
  { href: "/painel/perfil", label: "Perfil", icon: UserRound, soon: true },
  { href: "/painel/seguranca", label: "Segurança", icon: ShieldCheck },
  { href: "/painel/privacidade", label: "Privacidade", icon: Lock },
];

const ADMIN_NAV: Item[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: UserRound, soon: true },
  { href: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/admin/doacoes", label: "Doações", icon: HandCoins },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/admin/conciliacao", label: "Conciliação", icon: Scale },
  { href: "/admin/saques", label: "Saques", icon: Banknote },
  { href: "/admin/kyc", label: "KYC", icon: BadgeCheck },
  { href: "/admin/risco", label: "Risco", icon: ShieldAlert },
  { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { href: "/admin/lgpd", label: "LGPD", icon: FileLock2 },
  { href: "/admin/auditoria", label: "Auditoria", icon: ShieldCheck, soon: true },
];

export function AppSidebar({ area }: { area: "painel" | "admin" }) {
  const pathname = usePathname();
  const items = area === "admin" ? ADMIN_NAV : USER_NAV;

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/painel" &&
            item.href !== "/admin" &&
            pathname.startsWith(item.href));
        const Icon = item.icon;
        const content = (
          <>
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                em breve
              </span>
            )}
          </>
        );
        const className = cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          item.soon && "pointer-events-none opacity-60",
        );

        return item.soon ? (
          <span key={item.href} className={className} aria-disabled>
            {content}
          </span>
        ) : (
          <Link key={item.href} href={item.href} className={className}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
