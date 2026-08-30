/**
 * Motor de taxas (doc §9). Puro e testável. Percentuais em basis points.
 * Dinheiro sempre em centavos inteiros (doc §24).
 */

export type FeeRule = {
  id?: string;
  name: string;
  percentage_bps: number;
  fixed_fee_cents: number;
  min_fee_cents: number;
  withdrawal_fee_cents: number;
};

export type ProviderFeeConfig = {
  bps: number;
  minCents: number;
};

export type FeeBreakdown = {
  grossCents: number;
  platformFeeCents: number;
  providerFeeCents: number;
  netCents: number;
};

export function computeFees(
  grossCents: number,
  rule: FeeRule,
  provider: ProviderFeeConfig,
): FeeBreakdown {
  if (!Number.isInteger(grossCents) || grossCents <= 0) {
    throw new Error("grossCents deve ser inteiro positivo.");
  }

  const pctPart = Math.floor((grossCents * rule.percentage_bps) / 10000);
  const platformFeeCents = Math.max(
    rule.min_fee_cents,
    pctPart + rule.fixed_fee_cents,
  );

  const providerFeeCents = Math.max(
    provider.minCents,
    Math.floor((grossCents * provider.bps) / 10000),
  );

  const netCents = grossCents - platformFeeCents - providerFeeCents;
  if (netCents <= 0) {
    throw new Error(
      "Valor muito baixo: as taxas consomem o total. Aumente a doação.",
    );
  }

  return { grossCents, platformFeeCents, providerFeeCents, netCents };
}

/** Snapshot da regra para gravar na doação (doc §9). */
export function feeRuleSnapshot(rule: FeeRule, provider: ProviderFeeConfig) {
  return {
    rule: {
      id: rule.id ?? null,
      name: rule.name,
      percentage_bps: rule.percentage_bps,
      fixed_fee_cents: rule.fixed_fee_cents,
      min_fee_cents: rule.min_fee_cents,
    },
    provider_estimate: { bps: provider.bps, min_cents: provider.minCents },
    captured_at: new Date().toISOString(),
  };
}
