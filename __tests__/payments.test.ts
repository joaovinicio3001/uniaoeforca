import { describe, it, expect } from "vitest";

import { computeFees, feeRuleSnapshot, type FeeRule } from "@/lib/payments/fees";
import { donationSchema } from "@/lib/payments/validation";
import { PushinPayProvider } from "@/lib/payments/pushinpay";

const RULE: FeeRule = {
  name: "padrao-v1",
  percentage_bps: 500, // 5%
  fixed_fee_cents: 0,
  min_fee_cents: 0,
  withdrawal_fee_cents: 390,
};
const PROVIDER = { bps: 300, minCents: 77 }; // 3% min R$0,77

describe("computeFees (doc §9.1)", () => {
  it("reproduz o exemplo da doc: 100,00 → provider 3,00 · plataforma 5,00 · líquido 92,00", () => {
    const f = computeFees(10000, RULE, PROVIDER);
    expect(f.providerFeeCents).toBe(300);
    expect(f.platformFeeCents).toBe(500);
    expect(f.netCents).toBe(9200);
  });

  it("aplica mínimo do provedor em doações pequenas", () => {
    const f = computeFees(1000, RULE, PROVIDER); // 3% de 1000 = 30 < 77
    expect(f.providerFeeCents).toBe(77);
    expect(f.platformFeeCents).toBe(50);
    expect(f.netCents).toBe(1000 - 77 - 50);
  });

  it("respeita min_fee_cents e fixed_fee_cents da plataforma", () => {
    const rule: FeeRule = { ...RULE, fixed_fee_cents: 50, min_fee_cents: 100 };
    expect(computeFees(500, rule, PROVIDER).platformFeeCents).toBe(100); // max(100, 25+50)
    expect(computeFees(100000, rule, PROVIDER).platformFeeCents).toBe(5050); // 5000+50
  });

  it("tudo em inteiros; rejeita valor não-inteiro ou não-positivo", () => {
    const f = computeFees(9999, RULE, PROVIDER);
    expect(Number.isInteger(f.platformFeeCents)).toBe(true);
    expect(Number.isInteger(f.netCents)).toBe(true);
    expect(() => computeFees(0, RULE, PROVIDER)).toThrow();
    expect(() => computeFees(10.5, RULE, PROVIDER)).toThrow();
  });

  it("lança se as taxas consomem o valor", () => {
    expect(() => computeFees(80, RULE, PROVIDER)).toThrow();
  });

  it("snapshot registra regra + estimativa do provedor", () => {
    const snap = feeRuleSnapshot(RULE, PROVIDER);
    expect(snap.rule.percentage_bps).toBe(500);
    expect(snap.provider_estimate).toEqual({ bps: 300, min_cents: 77 });
  });
});

describe("donationSchema — BRL → centavos (doc §24)", () => {
  it("converte pt-BR para centavos inteiros", () => {
    expect(donationSchema.parse({ amount: "50,00" }).amount).toBe(5000);
    expect(donationSchema.parse({ amount: "1.234,56" }).amount).toBe(123456);
    expect(donationSchema.parse({ amount: "R$ 100" }).amount).toBe(10000);
  });
  it("aplica mínimo e máximo", () => {
    expect(donationSchema.safeParse({ amount: "4,99" }).success).toBe(false);
    expect(donationSchema.safeParse({ amount: "200000,00" }).success).toBe(false);
  });
  it("default method pix e anonymous false", () => {
    const d = donationSchema.parse({ amount: "10,00" });
    expect(d.method).toBe("pix");
    expect(d.anonymous).toBe(false);
  });
});

describe("PushinPayProvider.parseWebhook (idempotência — doc §8.4)", () => {
  const p = new PushinPayProvider();
  it("gera eventId estável = id:status e normaliza status", () => {
    const e = p.parseWebhook({ id: "abc-123", value: 5000, status: "paid" });
    expect(e).toEqual({
      eventId: "abc-123:paid",
      externalId: "abc-123",
      status: "paid",
      amountCents: 5000,
      raw: { id: "abc-123", value: 5000, status: "paid" },
    });
  });
  it("normaliza id para minúsculo (Pushin Pay varia a caixa entre endpoints)", () => {
    const e = p.parseWebhook({ id: "A2A058BD-11E9", value: "500", status: "paid" });
    expect(e?.externalId).toBe("a2a058bd-11e9");
    expect(e?.eventId).toBe("a2a058bd-11e9:paid");
    expect(e?.amountCents).toBe(500); // value string -> number
  });
  it("mapeia status desconhecido para created e sem id retorna null", () => {
    expect(p.parseWebhook({ id: "x", status: "sei-la" })?.status).toBe("created");
    expect(p.parseWebhook({ value: 1 })).toBeNull();
    expect(p.parseWebhook(null)).toBeNull();
  });
});
