import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Conta bloqueada",
  robots: { index: false },
};

export default function ContaBloqueadaPage() {
  return (
    <div className="container flex max-w-lg flex-col items-center py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-8" />
      </span>
      <h1 className="mt-5 text-2xl font-bold">Sua conta está bloqueada</h1>
      <p className="mt-2 text-muted-foreground">
        O acesso a esta conta foi suspenso pela nossa equipe. Se você acredita que
        isso é um engano, entre em contato pelo e-mail{" "}
        <a
          href="mailto:suporte@uniaoeforca.com.br"
          className="text-primary hover:underline"
        >
          suporte@uniaoeforca.com.br
        </a>{" "}
        para revisão.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-primary hover:underline"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}
