import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-brand-surface p-6 text-center">
      <Logo />
      <div>
        <p className="text-5xl font-bold text-primary">404</p>
        <h1 className="mt-2 text-xl font-semibold">Página não encontrada</h1>
        <p className="mt-1 text-muted-foreground">
          O endereço que você acessou não existe ou foi movido.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Voltar para a home</Link>
      </Button>
    </div>
  );
}
