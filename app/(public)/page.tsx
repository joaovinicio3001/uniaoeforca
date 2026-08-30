import Link from "next/link";
import {
  ShieldCheck,
  HandCoins,
  Wallet,
  HeartHandshake,
  Share2,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-brand-navy to-[#021f38] text-white">
        <div className="container grid gap-10 py-20 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              Grátis para criar · Doações por PIX · Saque quando quiser
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Junte pessoas por uma causa.
            </h1>
            <p className="max-w-md text-lg text-white/80">
              Crie uma campanha gratuita, receba doações por PIX e acompanhe cada
              contribuição em tempo real. Simples, rápido e seguro.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/cadastro">Criar minha campanha</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/campanhas">Ver campanhas</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-white/95">
            <CardContent className="space-y-4 p-6 text-card-foreground">
              <p className="text-sm font-semibold text-muted-foreground">
                Como funciona
              </p>
              <ol className="space-y-3 text-sm">
                <Step
                  n={1}
                  text="Crie sua campanha gratuitamente e conte a sua história."
                />
                <Step
                  n={2}
                  text="Compartilhe o link com amigos, familiares e nas redes sociais."
                />
                <Step
                  n={3}
                  text="Receba as doações por PIX e acompanhe tudo pelo painel."
                />
                <Step
                  n={4}
                  text="Solicite o repasse para a sua chave PIX quando precisar."
                />
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pilares */}
      <section className="container py-16">
        <h2 className="text-center text-2xl font-bold">
          Tudo o que você precisa para arrecadar com segurança
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<HeartHandshake />}
            title="Para qualquer causa"
            text="Saúde, emergências, animais, educação, projetos, família e muito mais."
          />
          <Feature
            icon={<HandCoins />}
            title="Doações por PIX"
            text="Quem quer ajudar paga na hora pelo QR Code. A doação entra automaticamente após a confirmação."
          />
          <Feature
            icon={<Wallet />}
            title="Acompanhe em tempo real"
            text="Veja cada doação, o total arrecadado e quanto já está disponível para saque."
          />
          <Feature
            icon={<Share2 />}
            title="Fácil de divulgar"
            text="Um link para compartilhar em qualquer lugar e uma página bonita para a sua campanha."
          />
          <Feature
            icon={<Eye />}
            title="Transparência total"
            text="Extrato completo de tudo o que entra e sai, doação por doação."
          />
          <Feature
            icon={<ShieldCheck />}
            title="Segurança de verdade"
            text="Verificação de identidade, monitoramento contra fraudes e seus dados protegidos."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-brand-surface">
        <div className="container flex flex-col items-center gap-4 py-14 text-center">
          <h2 className="text-2xl font-bold">Pronto para começar?</h2>
          <p className="max-w-md text-muted-foreground">
            Criar a campanha é grátis. Você só paga uma pequena taxa quando
            recebe uma doação.
          </p>
          <Button asChild size="lg">
            <Link href="/cadastro">Criar minha campanha</Link>
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
