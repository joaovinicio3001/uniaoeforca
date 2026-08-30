import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { formatBRL } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Visão geral" };

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = (await getSessionUser())!;
  const { erro } = await searchParams;

  const stats = [
    { label: "Total arrecadado", value: 0 },
    { label: "Saldo pendente", value: 0 },
    { label: "Saldo disponível", value: 0 },
    { label: "Total sacado", value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {user.displayName ?? user.fullName ?? "bem-vindo(a)"}
        </h1>
        <p className="text-muted-foreground">
          Este é o seu painel. As funções de campanha, doações e saque chegam nas
          próximas fases.
        </p>
      </div>

      {erro === "sem-permissao" && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar a área administrativa.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {formatBRL(s.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comece agora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Crie a sua campanha:</strong>{" "}
            monte um rascunho, adicione fotos e a sua história, e envie para
            análise. Após a aprovação, é só compartilhar o link.
          </p>
          <p>
            <strong className="text-foreground">Receba por PIX:</strong> as
            doações entram automaticamente e você acompanha tudo pela Carteira.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/painel/campanhas/nova"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Criar campanha
            </Link>
            <Link
              href="/painel/seguranca"
              className="rounded-md border px-3 py-1.5 text-xs font-medium"
            >
              Segurança da conta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
