import "server-only";

/**
 * Rate limiting básico em memória (doc §6.2, §15: "Rate limit em login e recuperação").
 *
 * LIMITAÇÃO CONHECIDA: janela fixa por instância. Serve para dev e para uma
 * única instância. Em produção multi-instância, trocar por Redis/Upstash ou pelo
 * rate limiting do Cloudflare (doc §34.1). A interface abaixo já isola isso.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  opts: { limit: number; windowSeconds: number },
): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: opts.limit - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;
  const ok = existing.count <= opts.limit;
  return {
    ok,
    remaining: Math.max(0, opts.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: ok ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Presets nomeados para os fluxos sensíveis da Fase 0. */
export const RATE_LIMITS = {
  login: { limit: 8, windowSeconds: 60 },
  register: { limit: 5, windowSeconds: 300 },
  forgotPassword: { limit: 4, windowSeconds: 300 },
} as const;

/** Uso de teste / manutenção. */
export function _resetRateLimitStore() {
  store.clear();
}
