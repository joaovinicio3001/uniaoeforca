import Link from "next/link";
import { ShieldCheck, ChevronRight } from "lucide-react";

/** Faixa "Sua segurança é nossa prioridade". Vertical no mobile. */
export function SecurityBanner() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#CFE0FF] bg-[linear-gradient(90deg,#F0F6FF,#F8FBFF)] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 sm:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#063CCB] text-white">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[#071D4A]">
            Sua segurança é nossa prioridade
          </p>
          <p className="text-sm text-[#5B6B88]">
            Mantenha seus dados sempre atualizados e ative a verificação em duas
            etapas.
          </p>
        </div>
      </div>

      <Link
        href="/painel/seguranca"
        className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1 rounded-[9px] border border-[#D7E2F1] bg-white px-4 text-sm font-medium text-[#063CCB] transition-colors hover:bg-[#F5F8FE] sm:w-auto"
      >
        Acessar segurança <ChevronRight className="size-4" />
      </Link>
    </section>
  );
}
