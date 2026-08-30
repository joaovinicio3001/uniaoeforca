import Link from "next/link";
import Image from "next/image";
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
      <section className="relative isolate overflow-hidden border-b bg-brand-navy text-white">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-brand-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent" />

        <div className="container relative py-24 md:py-32">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">
              Grátis para criar · Doações por PIX · Saque quando quiser
            </span>
            <h1 className="text-4xl font-bold leading-tight drop-shadow-sm md:text-5xl">
              Junte pessoas por uma causa.
            </h1>
            <p className="max-w-md text-lg text-white/85">
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
                className="border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white/15 hover:text-white"
              >
                <Link href="/campanhas">Ver campanhas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-b bg-brand-surface">
        <div className="container py-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Como funciona
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
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
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
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
