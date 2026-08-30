/**
 * Utilitários puros para o balancete (doc §27, §28: "cada centavo reconciliável";
 * "a soma das entradas e saídas do ledger fecha em zero por transação").
 */

export type TrialBalanceRow = {
  code: string | null;
  wallet_id: string | null;
  signed_cents: number | null;
};

export type TrialBalanceSummary = {
  total: number;
  balanced: boolean;
  byCode: { code: string; signed_cents: number }[];
};

export function summarizeTrialBalance(
  rows: TrialBalanceRow[],
): TrialBalanceSummary {
  let total = 0;
  const acc = new Map<string, number>();
  for (const r of rows) {
    const v = r.signed_cents ?? 0;
    total += v;
    const key = r.code ?? "?";
    acc.set(key, (acc.get(key) ?? 0) + v);
  }
  const byCode = [...acc.entries()]
    .map(([code, signed_cents]) => ({ code, signed_cents }))
    .sort((a, b) => a.code.localeCompare(b.code));
  return { total, balanced: total === 0, byCode };
}
