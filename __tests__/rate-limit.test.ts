import { describe, it, expect, beforeEach } from "vitest";

import {
  rateLimit,
  _resetRateLimitStore,
} from "@/lib/security/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => _resetRateLimitStore());

  it("libera até o limite e bloqueia depois", () => {
    const opts = { limit: 3, windowSeconds: 60 };
    expect(rateLimit("k", opts).ok).toBe(true);
    expect(rateLimit("k", opts).ok).toBe(true);
    expect(rateLimit("k", opts).ok).toBe(true);
    const blocked = rateLimit("k", opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("isola por chave", () => {
    const opts = { limit: 1, windowSeconds: 60 };
    expect(rateLimit("a", opts).ok).toBe(true);
    expect(rateLimit("b", opts).ok).toBe(true);
    expect(rateLimit("a", opts).ok).toBe(false);
  });

  it("reporta remaining decrescente", () => {
    const opts = { limit: 2, windowSeconds: 60 };
    expect(rateLimit("r", opts).remaining).toBe(1);
    expect(rateLimit("r", opts).remaining).toBe(0);
  });
});
