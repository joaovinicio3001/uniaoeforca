import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Sanitização do HTML da história/atualizações da campanha (doc §7.1 "Texto
 * completo, sanitizado"; §15 "Sanitização de HTML de campanhas").
 *
 * Allowlist estreita: formatação básica + links (forçados a https, rel seguro).
 * Sem imagens embutidas (mídia vai por campaign_media), sem iframes, sem style.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "ul", "ol", "li", "blockquote",
    "h2", "h3", "h4",
    "a", "hr",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["https", "mailto"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: "_blank",
        rel: "noopener noreferrer nofollow ugc",
      },
    }),
    h1: "h2",
  },
  disallowedTagsMode: "discard",
  enforceHtmlBoundary: true,
};

export function sanitizeRichText(dirty: string): string {
  const input = dirty ?? "";
  // Entrada de textarea sem marcação → transforma parágrafos/quebras em HTML
  // antes de sanitizar, para preservar a formatação básica do autor.
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(input);
  const html = looksLikeHtml ? input : plainTextToHtml(input);
  return sanitizeHtml(html, OPTIONS).trim();
}

function plainTextToHtml(text: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Texto puro (para meta description, prévia, contagem de caracteres). */
export function toPlainText(html: string): string {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
