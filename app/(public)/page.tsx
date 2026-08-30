import Link from "next/link";
import {
  ShieldCheck,
  Receipt,
  Wallet,
  HeartHandshake,
  LineChart,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-brand-navy to-[#04264d] text-white">
        <div className="container grid gap-10 py-20 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              Fase 0 · Fundação em desenvolvimento
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Transforme apoio em ação.
            </h1>
            <p className="max-w-md text-lg text-white/80">
              Crie uma campanha, receba contribuições por PIX e acompanhe a
              arrecadação com um saldo rastreável e auditável.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/cadastro">Começar uma campanha</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/campanhas">Explorar causas</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-white/95">
            <CardContent className="space-y-4 p-6 text-card-foreground">
              <p className="text-sm font-semibold text-muted-foreground">
                Como o dinheiro se move
              </p>
              <ol className="space-y-3 text-sm">
                <Step n={1} text="Doador paga via PIX na página da campanha." />
                <Step
                  n={2}
                  text="O provedor confirma o pagamento por webhook validado."
                />
                <Step
                  n={3}
                  text="O ledger credita o valor líquido — nunca pelo navegador."
                />
                <Step
                  n={4}
                  text="Beneficiário solicita saque; sai por PIX após análise."
                />
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pilares */}
      <section className="container py-16">
        <h2 className="text-center text-2xl font-bold">
          Feito para receber e repassar com responsabilidade
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<HeartHandshake />}
            title="Campanhas com propósito"
            text="Categorias de saúde, emergência, animais, educação, família e mais."
          />
          <Feature
            icon={<Receipt />}
            title="PIX confirmado de verdade"
            text="Crédito só entra após confirmação do provedor. Idempotência ponta a ponta."
          />
          <Feature
            icon={<Wallet />}
            title="Saldo rastreável"
            text="Pendente, disponível, reservado e sacado — cada centavo reconciliável."
          />
          <Feature
            icon={<ShieldCheck />}
            title="Saques com análise"
            text="Solicitação reserva o saldo na hora; pagamento após aprovação e checagens."
          />
          <Feature
            icon={<LineChart />}
            title="Transparência"
            text="Extrato completo com a origem de cada lançamento do ledger."
          />
          <Feature
            icon={<Lock />}
            title="Segurança"
            text="RLS no banco, MFA para administração, trilha de auditoria de tudo."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-brand-surface">
        <div className="container flex flex-col items-center gap-4 py-14 text-center">
          <h2 className="text-2xl font-bold">Pronto para começar?</h2>
          <p className="max-w-md text-muted-foreground">
            Crie sua conta gratuitamente e publique a primeira campanha assim que
            a Fase 1 estiver disponível.
          </p>
          <Button asChild size="lg">
            <Link href="/cadastro">Criar conta</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <span>{text}</span>
    </li>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
          {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
