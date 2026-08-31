import {
  GraduationCap,
  HeartPulse,
  Lightbulb,
  PawPrint,
  Siren,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { CATEGORY_SLUGS, type CategorySlug } from "@/lib/campaigns/validation";

/**
 * Metadados de apresentação das categorias do wizard de criação de campanha.
 * Os slugs e a existência das categorias vêm do banco (`categories`); aqui só
 * moram ícone e descrição curta para os cards. O nome exibido usa o `name` real
 * do banco quando disponível.
 */
export const CATEGORY_META: Record<
  CategorySlug,
  { icon: LucideIcon; description: string }
> = {
  saude: {
    icon: HeartPulse,
    description: "Tratamentos, exames, cirurgias e medicamentos",
  },
  emergencia: {
    icon: Siren,
    description: "Situações urgentes e imprevistos",
  },
  animais: {
    icon: PawPrint,
    description: "Cuidados, tratamentos e resgates",
  },
  educacao: {
    icon: GraduationCap,
    description: "Estudos, livros, cursos e projetos",
  },
  familia: {
    icon: Users,
    description: "Apoio a familiares e manutenção",
  },
  projetos: {
    icon: Lightbulb,
    description: "Projetos sociais e iniciativas",
  },
  esportes: {
    icon: Trophy,
    description: "Atletas, times e competições",
  },
  outros: {
    icon: Sparkles,
    description: "Outras causas",
  },
};

export const WIZARD_STEPS = [
  "Começo",
  "Categoria",
  "História",
  "Imagens",
  "Revisão",
  "Compartilhar",
] as const;

/** Limites reais espelhados de `campaignDraftSchema` (lib/campaigns/validation). */
export const WIZARD_LIMITS = {
  titleMin: 5,
  titleMax: 120,
  summaryMin: 10,
  summaryMax: 200,
  storyMax: 20000,
  storySoftMin: 30,
  goalMinCents: 5000,
  goalMaxCents: 500_000_000,
  imageMaxBytes: 5 * 1024 * 1024,
} as const;

export type WizardDraft = {
  title: string;
  summary: string;
  goalReais: string;
  categorySlug: string;
  story: string;
};

export const EMPTY_DRAFT: WizardDraft = {
  title: "",
  summary: "",
  goalReais: "",
  categorySlug: "",
  story: "",
};

const STORAGE_KEY = "uef:campaign-wizard";

/** Rascunho leve do wizard em sessionStorage (só texto — sem dados sensíveis). */
export function loadWizardDraft(): WizardDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardDraft>;
    return { ...EMPTY_DRAFT, ...parsed };
  } catch {
    return null;
  }
}

export function saveWizardDraft(draft: WizardDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

export function clearWizardDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** "10.000,00" → centavos inteiros (mesma lógica do schema do backend). */
export function reaisMaskToCents(masked: string): number {
  const digits = masked.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}

/** Máscara BRL: acumula centavos da direita para a esquerda. */
export function maskReais(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

/** Sugestão de texto para compartilhamento (editável pela pessoa). */
export function suggestedShareText(title: string): string {
  return `Criei a campanha "${title}" no União & Força. Se puder contribuir ou compartilhar, vai ajudar muito!`;
}
