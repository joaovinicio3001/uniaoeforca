import Link from "next/link";
import { Megaphone, Plus, ShieldCheck, Heart } from "lucide-react";

/** Card "Comece agora" — ilustração + textos + 2 ações. Vertical no mobile. */
export function GettingStartedCard() {
  return (
    <section className="rounded-[20px] border border-[#E0E8F3] bg-white p-6 shadow-[0_8px_25px_rgba(25,55,100,0.05)] sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
        {/* Ilustração */}
        <div className="relative mx-auto grid size-32 shrink-0 place-items-center sm:size-40 lg:mx-0">
          <span className="absolute left-0 top-2 size-16 rounded-full bg-[#EAF2FF] sm:size-20" />
          <span className="absolute bottom-1 right-1 size-12 rounded-full bg-[#EAF9EF] sm:size-16" />
          <span className="absolute right-3 top-3 size-2.5 rounded-full bg-[#FFB800]" />
          <span className="absolute bottom-4 left-4 size-2 rounded-full bg-[#23B64B]" />
          <span className="relative grid size-20 place-items-center rounded-2xl bg-[#063CCB] text-white shadow-[0_10px_24px_rgba(6,60,203,0.3)] sm:size-24">
            <Megaphone className="size-9 sm:size-11" />
            <span className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full bg-[#23B64B] text-white ring-4 ring-white sm:size-8">
              <Heart className="size-3.5 sm:size-4" fill="currentColor" />
            </span>
          </span>
        </div>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-[#071D4A] sm:text-[28px]">
            Comece agora 🚀
          </h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#435675] sm:text-base">
            <p>
              <strong className="font-semibold text-[#071D4A]">
                Crie a sua campanha:
              </strong>{" "}
              monte um rascunho, adicione fotos e a sua história, e envie para
              análise. Após a aprovação, é só compartilhar o link.
            </p>
            <p>
              <strong className="font-semibold text-[#071D4A]">
                Receba por PIX:
              </strong>{" "}
              as doações entram automaticamente e você acompanha tudo pela
              Carteira.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/painel/campanhas/nova"
              className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#0645D8] px-6 font-semibold text-white shadow-[0_8px_18px_rgba(6,69,216,0.25)] transition-colors hover:bg-[#0A3AB8] sm:w-auto"
            >
              <Plus className="size-4" /> Criar campanha
            </Link>
            <Link
              href="/painel/seguranca"
              className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#D6E0EE] bg-white px-6 font-medium text-[#17315C] transition-colors hover:bg-[#F5F8FE] sm:w-auto"
            >
              <ShieldCheck className="size-4" /> Segurança da conta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
