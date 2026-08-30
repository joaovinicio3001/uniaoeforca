/**
 * Geração de slug de campanha (doc §7.1: "Único, derivado do título e imutável
 * após publicação ou com histórico de redirects"). Puro — a garantia de
 * unicidade é feita por quem chama, consultando o banco.
 */

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos combinantes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

/**
 * Dado o slug base e um conjunto de slugs já usados, devolve um slug livre
 * anexando `-2`, `-3`, … quando necessário.
 */
export function ensureUniqueSlug(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  const root = slugify(base) || "campanha";
  if (!set.has(root)) return root;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`;
    if (!set.has(candidate)) return candidate;
  }
  return `${root}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isValidSlug(slug: string): boolean {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length >= 3 &&
    slug.length <= 80
  );
}
