import { describe, it, expect } from "vitest";

import { slugify, ensureUniqueSlug, isValidSlug } from "@/lib/campaigns/slug";
import {
  allowedTransitions,
  canTransition,
  slugIsLocked,
} from "@/lib/campaigns/state-machine";
import { sanitizeRichText, toPlainText } from "@/lib/campaigns/sanitize";
import { campaignDraftSchema } from "@/lib/campaigns/validation";

describe("slug", () => {
  it("normaliza acentos, espaços e caixa", () => {
    expect(slugify("Ajude o João & a Família!")).toBe("ajude-o-joao-a-familia");
    expect(slugify("  Múltiplos   espaços  ")).toBe("multiplos-espacos");
  });
  it("garante unicidade com sufixo incremental", () => {
    expect(ensureUniqueSlug("Campanha X", [])).toBe("campanha-x");
    expect(ensureUniqueSlug("Campanha X", ["campanha-x"])).toBe("campanha-x-2");
    expect(
      ensureUniqueSlug("Campanha X", ["campanha-x", "campanha-x-2"]),
    ).toBe("campanha-x-3");
  });
  it("valida formato", () => {
    expect(isValidSlug("ajuda-joao")).toBe(true);
    expect(isValidSlug("-ruim-")).toBe(false);
    expect(isValidSlug("ab")).toBe(false);
  });
});

describe("state-machine (doc §7.2)", () => {
  it("draft só vai para pending_review", () => {
    expect(allowedTransitions("draft", "owner")).toEqual(["pending_review"]);
  });
  it("apenas staff aprova/reprova/bloqueia", () => {
    expect(canTransition("pending_review", "active", "staff")).toBe(true);
    expect(canTransition("pending_review", "active", "owner")).toBe(false);
    expect(canTransition("active", "blocked", "owner")).toBe(false);
    expect(canTransition("active", "blocked", "staff")).toBe(true);
  });
  it("active <-> paused", () => {
    expect(canTransition("active", "paused", "owner")).toBe(true);
    expect(canTransition("paused", "active", "owner")).toBe(true);
  });
  it("rejected volta para draft; archived é terminal", () => {
    expect(canTransition("rejected", "draft", "owner")).toBe(true);
    expect(allowedTransitions("archived", "staff")).toEqual([]);
  });
  it("slug trava após sair de draft/pending/rejected", () => {
    expect(slugIsLocked("draft")).toBe(false);
    expect(slugIsLocked("pending_review")).toBe(false);
    expect(slugIsLocked("active")).toBe(true);
    expect(slugIsLocked("completed")).toBe(true);
  });
});

describe("sanitize (doc §7.1, §15)", () => {
  it("remove script/iframe/on* e mantém formatação básica", () => {
    const dirty =
      '<p>Olá <strong>mundo</strong></p><script>alert(1)</script><iframe src="x"></iframe><img src=x onerror=alert(1)>';
    const clean = sanitizeRichText(dirty);
    expect(clean).toContain("<strong>mundo</strong>");
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("iframe");
    expect(clean).not.toContain("onerror");
  });
  it("força links a target/rel seguros", () => {
    const clean = sanitizeRichText('<a href="https://x.com">x</a>');
    expect(clean).toContain('rel="noopener noreferrer nofollow ugc"');
    expect(clean).toContain('target="_blank"');
  });
  it("bloqueia esquema javascript:", () => {
    const clean = sanitizeRichText('<a href="javascript:alert(1)">x</a>');
    expect(clean).not.toContain("javascript:");
  });
  it("converte texto puro em parágrafos", () => {
    const clean = sanitizeRichText("linha 1\n\nlinha 2");
    expect(clean).toBe("<p>linha 1</p><p>linha 2</p>");
  });
  it("toPlainText remove marcação", () => {
    expect(toPlainText("<p>oi <b>gente</b></p>")).toBe("oi gente");
  });
});

describe("campaignDraftSchema — meta em centavos (doc §24)", () => {
  const base = {
    title: "Ajuda para tratamento",
    categorySlug: "saude",
    summary: "Precisamos de apoio para custear o tratamento.",
    goalAmount: "10.000,00",
  };
  it("converte reais (pt-BR) para centavos inteiros", () => {
    const parsed = campaignDraftSchema.parse(base);
    expect(parsed.goalAmount).toBe(1_000_000);
    expect(Number.isInteger(parsed.goalAmount)).toBe(true);
  });
  it("aceita valor simples com vírgula", () => {
    expect(campaignDraftSchema.parse({ ...base, goalAmount: "50,00" }).goalAmount).toBe(5000);
  });
  it("rejeita abaixo do mínimo e categoria inválida", () => {
    expect(campaignDraftSchema.safeParse({ ...base, goalAmount: "10,00" }).success).toBe(false);
    expect(campaignDraftSchema.safeParse({ ...base, categorySlug: "xpto" }).success).toBe(false);
  });
  it("normaliza UF e rejeita UF inexistente", () => {
    expect(campaignDraftSchema.parse({ ...base, state: "sp" }).state).toBe("SP");
    expect(campaignDraftSchema.safeParse({ ...base, state: "ZZ" }).success).toBe(false);
  });
});
