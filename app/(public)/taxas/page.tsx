import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { computeFees } from "@/lib/payments/fees";
import { formatBRL } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Taxas",
  description:
    "As taxas da União & Força são configuráveis, versionadas e exibidas com transparência.",
};

export default async function TaxasPage() {
  const supabase = await createClient();
  const { data: rule } = await supabase
    .from("fee_rules")
    .select("*")
    .lte("active_from", new Date().toISOString())
    .or(`active_to.is.null,active_to.gt.${new Date().toISOString()}`)
    .order("active_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pct = rule ? rule.percentage_bps / 100 : 5;
  const withdrawalFee = rule?.withdrawal_fee_cents ?? 390;
  const env = serverEnv();

  const example =
    rule &&
    (() => {
      try {
        return computeFees(10000, rule, {
          bps: env.PUSHINPAY_FEE_BPS,
          minCents: env.PUSHINPAY_FEE_MIN_CENTS,
        });
      } catch {
        return null;
      }
    })();

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold">Taxas</h1>
      <p className="mt-2 text-muted-foreground">
        Nossas taxas são configuráveis, versionadas e ficam registradas em cada
        doação (doc §9). Sem surpresas.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa da plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
            </p>
            <p className="text-sm text-muted-foreground">por doação confirmada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de saque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBRL(withdrawalFee)}</p>
            <p className="text-sm text-muted-foreground">por saque via PIX</p>
          </CardContent>
        </Card>
      </div>

      {example && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Exemplo para uma doação de {formatBRL(10000)}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              <Row label="Doação bruta" value={`+ ${formatBRL(example.grossCents)}`} />
              <Row
                label="Custo estimado do provedor de PIX"
                value={`- ${formatBRL(example.providerFeeCents)}`}
              />
              <Row
                label="Taxa União & Força"
                value={`- ${formatBRL(example.platformFeeCents)}`}
              />
              <Row
                label="Crédito líquido para a campanha"
                value={`+ ${formatBRL(example.netCents)}`}
                strong
              />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              O custo do provedor é uma estimativa reconciliada depois com o valor
              efetivamente cobrado pela API (doc §9, §12).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "font-bold" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
