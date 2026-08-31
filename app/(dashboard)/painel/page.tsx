import type { Metadata } from "next";
import {
  AlertTriangle,
  CircleDollarSign,
  Hourglass,
  WalletCards,
  HandCoins,
} from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { getMyWalletBalance } from "@/lib/ledger/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { MetricCard } from "@/components/dashboard/metric-card";
import { GettingStartedCard } from "@/components/dashboard/getting-started-card";
import { SecurityBanner } from "@/components/dashboard/security-banner";

export const metadata: Metadata = { title: "Visão geral" };

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = (await getSessionUser())!;
  const { erro } = await searchParams;

  // Valores reais da carteira do usuário (zerados enquanto não houver movimento).
  const w = await getMyWalletBalance().catch(() => null);
  const totalArrecadado = w
    ? w.pending_cents +
      w.available_cents +
      w.reserved_cents +
      w.held_cents +
      w.withdrawn_cents
    : 0;

  const nome = user.displayName ?? user.fullName ?? "bem-vindo(a)";

  return (
    <div className="space-y-6 sm:space-y-7">
      <section className="relative">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-[26px] font-bold leading-tight text-[#071D4A] sm:text-[34px] lg:text-[36px]">
            Olá, {nome} 👋
          </h1>
          <p className="mt-2 text-[15px] text-[#586987] sm:text-base">
            Este é o seu painel. As funções de campanha, doações e saque chegam
            nas próximas fases.
          </p>
        </div>
        <DashboardHero />
      </section>

      {erro === "sem-permissao" && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar a área administrativa.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
        <MetricCard
          label="Total arrecadado"
          valueCents={totalArrecadado}
          icon={CircleDollarSign}
          tone="blue"
        />
        <MetricCard
          label="Saldo pendente"
          valueCents={w?.pending_cents ?? 0}
          icon={Hourglass}
          tone="green"
        />
        <MetricCard
          label="Saldo disponível"
          valueCents={w?.available_cents ?? 0}
          icon={WalletCards}
          tone="yellow"
        />
        <MetricCard
          label="Total sacado"
          valueCents={w?.withdrawn_cents ?? 0}
          icon={HandCoins}
          tone="purple"
        />
      </div>

      <GettingStartedCard />
      <SecurityBanner />
    </div>
  );
}
