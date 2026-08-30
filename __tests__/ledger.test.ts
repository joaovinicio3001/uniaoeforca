import { describe, it, expect } from "vitest";

import {
  summarizeTrialBalance,
  type TrialBalanceRow,
} from "@/lib/ledger/trial-balance";

describe("summarizeTrialBalance (doc §28: ledger fecha em zero)", () => {
  it("um lançamento de doação (D caixa = C net+plat+prov) soma zero", () => {
    // gross 500 = net 398 + platform 25 + provider 77
    const rows: TrialBalanceRow[] = [
      { code: "CASH_PROVIDER_IN", wallet_id: null, signed_cents: 500 }, // débito
      { code: "CAMPAIGN_PENDING", wallet_id: "w1", signed_cents: -398 }, // crédito
      { code: "PLATFORM_REVENUE", wallet_id: null, signed_cents: -25 },
      { code: "PROVIDER_FEES", wallet_id: null, signed_cents: -77 },
      // liberação pending -> available (débito pending / crédito available)
      { code: "CAMPAIGN_PENDING", wallet_id: "w1", signed_cents: 398 },
      { code: "CAMPAIGN_AVAILABLE", wallet_id: "w1", signed_cents: -398 },
    ];
    const s = summarizeTrialBalance(rows);
    expect(s.total).toBe(0);
    expect(s.balanced).toBe(true);
  });

  it("agrega por code e detecta desbalanceamento", () => {
    const s = summarizeTrialBalance([
      { code: "CASH_PROVIDER_IN", wallet_id: null, signed_cents: 100 },
      { code: "PLATFORM_REVENUE", wallet_id: null, signed_cents: -90 },
    ]);
    expect(s.total).toBe(10);
    expect(s.balanced).toBe(false);
    expect(s.byCode).toEqual([
      { code: "CASH_PROVIDER_IN", signed_cents: 100 },
      { code: "PLATFORM_REVENUE", signed_cents: -90 },
    ]);
  });

  it("consolida linhas do mesmo code (contas por carteira)", () => {
    const s = summarizeTrialBalance([
      { code: "CAMPAIGN_AVAILABLE", wallet_id: "w1", signed_cents: -100 },
      { code: "CAMPAIGN_AVAILABLE", wallet_id: "w2", signed_cents: -50 },
    ]);
    expect(s.byCode).toEqual([
      { code: "CAMPAIGN_AVAILABLE", signed_cents: -150 },
    ]);
    expect(s.total).toBe(-150);
  });

  it("trata signed_cents nulo como zero", () => {
    const s = summarizeTrialBalance([
      { code: "X", wallet_id: null, signed_cents: null },
      { code: "Y", wallet_id: null, signed_cents: 0 },
    ]);
    expect(s.total).toBe(0);
    expect(s.balanced).toBe(true);
  });
});
