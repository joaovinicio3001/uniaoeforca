/**
 * Versões vigentes dos documentos legais. Ao publicar uma alteração relevante,
 * suba a data aqui — usuários que aceitaram uma versão anterior verão o aviso
 * de reconsentimento no painel.
 */
export const LEGAL_DOCUMENTS = ["terms", "privacy", "campaign_policy"] as const;
export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number];

export const CURRENT_LEGAL_VERSIONS: Record<LegalDocument, string> = {
  terms: "2026-08-31",
  privacy: "2026-08-31",
  campaign_policy: "2026-08-31",
};

export const LEGAL_META: Record<
  LegalDocument,
  { label: string; href: string }
> = {
  terms: { label: "Termos de Uso", href: "/termos" },
  privacy: { label: "Política de Privacidade", href: "/privacidade" },
  campaign_policy: {
    label: "Política de Campanhas",
    href: "/politica-campanhas",
  },
};

/** Documentos aceitos no cadastro. */
export const SIGNUP_LEGAL_DOCUMENTS: LegalDocument[] = ["terms", "privacy"];
