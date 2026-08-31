import {
  Home,
  Megaphone,
  HandHeart,
  Wallet,
  Banknote,
  BadgeCheck,
  UserRound,
  ShieldCheck,
  Lock,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
};

/** Navegação do Painel do usuário. Rotas preservadas do projeto atual. */
export const PAINEL_NAV: NavItem[] = [
  { href: "/painel", label: "Visão geral", icon: Home },
  { href: "/painel/campanhas", label: "Minhas campanhas", icon: Megaphone },
  { href: "/painel/contribuicoes", label: "Contribuições", icon: HandHeart },
  { href: "/painel/carteira", label: "Carteira", icon: Wallet },
  { href: "/painel/saques", label: "Saques", icon: Banknote },
  { href: "/painel/kyc", label: "Verificação", icon: BadgeCheck },
  { href: "/painel/perfil", label: "Perfil", icon: UserRound, soon: true },
  { href: "/painel/seguranca", label: "Segurança", icon: ShieldCheck },
  { href: "/painel/privacidade", label: "Privacidade", icon: Lock },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/painel") return pathname === "/painel";
  return pathname === href || pathname.startsWith(`${href}/`);
}
