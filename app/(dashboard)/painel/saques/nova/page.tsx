import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listMyPixKeys } from "@/lib/withdrawals/queries";
import { getMyWalletBalance } from "@/lib/ledger/queries";
import { getMyKycSummary } from "@/lib/kyc/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WithdrawalForm } from "./withdrawal-form";

export const metadata: Metadata = { title: "Solicitar saque" };

export default async function NovoSaquePage() {
  await requireUser("/painel/saques/nova");

  const [keys, balance, kyc] = await Promise.all([
    listMyPixKeys(),
    getMyWalletBalance(),
    getMyKycSummary(),
  ]);
  const verifiedKeys = keys.filter((k) => k.status === "verified");

  if (balance.available_cents <= 0) redirect("/painel/saques");

  const supabase = await createClient();
  const { data: rule } = await supabase
    .from("fee_rules")
    .select("withdrawal_fee_cents")
    .lte("active_from", new Date().toISOString())
    .or(`active_to.is.null,active_to.gt.${new Date().toISOString()}`)
    .order("active_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  const feeCents = rule?.withdrawal_fee_cents ?? 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/painel/saques">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Solicitar saque</h1>
        <p className="text-muted-foreground">
          O valor sai do saldo disponível e vai para análise.
        </p>
      </div>

      {!kyc.hasBasic ? (
        <Alert variant="warning">
          <AlertDescription>
            Verificação de identidade pendente.{" "}
            <Link href="/painel/kyc" className="font-medium text-primary hover:underline">
              Fazer verificação
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : !kyc.hasEnhanced ? (
        <Alert variant="warning">
          <AlertDescription>
            O primeiro saque (e valores maiores) exige verificação reforçada
            (documento + selfie).{" "}
            <Link href="/painel/kyc" className="font-medium text-primary hover:underline">
              Enviar documentos
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : verifiedKeys.length === 0 ? (
        <Alert variant="warning">
          <AlertDescription>
            Você precisa de uma chave PIX verificada.{" "}
            <Link
              href="/painel/saques/chaves"
              className="font-medium text-primary hover:underline"
            >
              Cadastrar chave
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dados do saque</CardTitle>
          </CardHeader>
          <CardContent>
            <WithdrawalForm
              keys={verifiedKeys.map((k) => ({
                id: k.id,
                type: k.type,
                masked: k.value_masked,
              }))}
              availableCents={balance.available_cents}
              feeCents={feeCents}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
