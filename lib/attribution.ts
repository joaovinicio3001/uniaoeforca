/**
 * Atribuição de anúncios (first-party). Guardamos apenas os parâmetros de
 * campanha na origem do próprio site — nada é enviado para terceiros aqui.
 * Serve para não perder utm/fbclid/gclid quando o usuário sai da landing page
 * para o cadastro e depois para a criação da campanha.
 */
export const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const;

export type Attribution = Partial<
  Record<(typeof ATTRIBUTION_PARAMS)[number], string>
>;

const STORAGE_KEY = "uf_attr";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const MAX_LEN = 200;

/** Extrai os parâmetros de atribuição de uma query string. */
export function pickAttribution(
  search: string | URLSearchParams,
): Attribution {
  const sp =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const out: Attribution = {};
  for (const key of ATTRIBUTION_PARAMS) {
    const v = sp.get(key);
    if (v) out[key] = v.slice(0, MAX_LEN);
  }
  return out;
}

/** Grava a atribuição da URL atual no localStorage (last-touch). Só no cliente. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const fresh = pickAttribution(window.location.search);
    if (Object.keys(fresh).length === 0) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...fresh, _ts: Date.now() }),
    );
  } catch {
    /* localStorage indisponível — segue sem atribuição */
  }
}

/** Lê a atribuição guardada (ignora se estiver velha). Só no cliente. */
export function getStoredAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Attribution & { _ts?: number };
    if (parsed._ts && Date.now() - parsed._ts > MAX_AGE_MS) return {};
    const { _ts, ...rest } = parsed;
    void _ts;
    return rest;
  } catch {
    return {};
  }
}

/** Acrescenta parâmetros de atribuição a um href, sem sobrescrever os existentes. */
export function appendAttribution(
  href: string,
  extra?: Attribution,
): string {
  const attr = { ...getStoredAttribution(), ...(extra ?? {}) };
  if (Object.keys(attr).length === 0) return href;

  const [path = "", hash] = href.split("#");
  const [base = "", query = ""] = path.split("?");
  const sp = new URLSearchParams(query);
  for (const [k, v] of Object.entries(attr)) {
    if (v && !sp.has(k)) sp.set(k, v);
  }
  const qs = sp.toString();
  return `${base}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
}
