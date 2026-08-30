import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { computeFees } from "@/lib/payments/fees";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Custos",
  description:
    "Criar e divulgar uma campanha é grátis. Veja em detalhe cada custo — taxa da plataforma, custo do PIX e custo do saque — sem nada escondido.",
};

export const revalidate = 600;

export default async function CustosPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: rule } = await supabase
    .from("fee_rules")
    .select("*")
    .lte("active_from", now)
    .or(`active_to.is.null,active_to.gt.${now}`)
    .order("active_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pct = rule ? rule.percentage_bps / 100 : 5;
  const withdrawalFee = rule?.withdrawal_fee_cents ?? 0;
  const env = serverEnv();

  const ex =
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
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Custos</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Criar, editar e divulgar uma campanha é 100% gratuito. Não há
        mensalidade, taxa de adesão nem cobrança por campanha. Você só tem custo
        quando dinheiro entra ou sai — e cada centavo fica registrado na sua
        campanha.
      </p>

      {/* Resumo */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Para criar" value="Grátis" hint="Sem mensalidade" />
        <SummaryCard
          title="Por doação"
          value={`${pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}
          hint="Taxa da plataforma"
        />
        <SummaryCard
          title="Para sacar"
          value={withdrawalFee > 0 ? formatBRL(withdrawalFee) : "Sem taxa"}
          hint="+ custo do PIX"
        />
      </div>

      {/* 1. Criar */}
      <Section
        n={1}
        title="Criar e divulgar: sem custo"
        body={
          <>
            <p>
              O cadastro é gratuito e não pedimos cartão de crédito. Você pode
              montar quantas campanhas quiser, editar a qualquer momento e
              divulgar o link livremente. Não cobramos por visualização, por
              compartilhamento nem por tempo de campanha.
            </p>
          </>
        }
      />

      {/* 2. Taxa plataforma */}
      <Section
        n={2}
        title="Taxa da plataforma"
        body={
          <>
            <p>
              Cobramos{" "}
              <strong>
                {pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
              </strong>{" "}
              sobre cada doação <em>confirmada</em>. Doação não paga não gera
              custo. A taxa é descontada automaticamente antes do valor entrar no
              saldo da campanha, e o percentual usado fica gravado em cada
              doação.
            </p>
            <p className="mt-3">Essa taxa mantém:</p>
            <ul>
              <li>a infraestrutura, o processamento e a disponibilidade da plataforma;</li>
              <li>a verificação de identidade de quem arrecada;</li>
              <li>o monitoramento antifraude e a análise de saques;</li>
              <li>a conciliação diária com os meios de pagamento;</li>
              <li>o atendimento e o suporte a criadores e doadores.</li>
            </ul>
          </>
        }
      />

      {/* 3. Custo do PIX (recebimento) */}
      <Section
        n={3}
        title="Custo de receber por PIX"
        body={
          <>
            <p>
              O meio de pagamento cobra uma tarifa fixa de{" "}
              <strong>{formatBRL(env.PUSHINPAY_FEE_MIN_CENTS)}</strong> por
              doação recebida, sem percentual. Repassamos esse custo pelo valor
              exato, sem margem. Ele aparece separado da taxa da plataforma no
              detalhamento de cada doação.
            </p>
          </>
        }
      />

      {/* 4. Custo do saque */}
      <Section
        n={4}
        title="Custo de sacar para a sua conta"
        body={
          <>
            <p>
              Quando você solicita o repasse do saldo para a sua chave PIX,
              incidem dois valores:
            </p>
            <ul>
              <li>
                <strong>Taxa de saque da plataforma:</strong>{" "}
                {withdrawalFee > 0
                  ? `${formatBRL(withdrawalFee)} por solicitação`
                  : "sem cobrança no momento"}
                .
              </li>
              <li>
                <strong>Custo do PIX no envio:</strong> cobrado pelo provedor de
                pagamentos — 3% do valor, com mínimo de {formatBRL(77)} por
                saque.
              </li>
            </ul>
            <p className="mt-3">
              Os dois valores são mostrados antes de você confirmar o saque. Não
              há prazo mínimo de campanha para sacar.
            </p>
          </>
        }
      />

      {/* Exemplo */}
      {ex && (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Exemplo: uma doação de {formatBRL(10000)}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              <Row label="Doação recebida" value={`+ ${formatBRL(ex.grossCents)}`} />
              <Row
                label={`Taxa da plataforma (${pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%)`}
                value={`- ${formatBRL(ex.platformFeeCents)}`}
              />
              <Row
                label="Custo do PIX (meio de pagamento)"
                value={`- ${formatBRL(ex.providerFeeCents)}`}
              />
              <Row
                label="Fica para a campanha"
                value={`+ ${formatBRL(ex.netCents)}`}
                strong
              />
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              O custo do PIX pode variar centavos conforme o meio de pagamento; o
              valor exato de cada doação aparece no seu extrato. A taxa de saque,
              quando houver, incide só no momento do repasse.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quando não paga */}
      <Section
        n={5}
        title="Quando você não paga nada"
        body={
          <ul>
            <li>Criar, editar ou excluir uma campanha.</li>
            <li>Divulgar o link e receber visitas.</li>
            <li>Doações que não são pagas ou que expiram.</li>
            <li>Consultar o saldo, o extrato e os relatórios.</li>
          </ul>
        }
      />

      <div className="mt-10 rounded-xl border bg-brand-surface p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">Sem letras miúdas.</strong> Todos os
        valores acima são os únicos custos da plataforma. Não cobramos nada por
        fora, não vendemos dados e não há taxa de inatividade.
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/cadastro">Criar minha campanha</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/como-funciona">Ver como funciona</Link>
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Section({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-muted-foreground [&_li]:ml-1 [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {body}
      </div>
    </section>
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
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={strong ? "font-bold" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
