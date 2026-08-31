import Link from "next/link";
import { CircleHelp, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Card "Precisa de ajuda?" — usado no rodapé da sidebar e no drawer mobile. */
export function HelpCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E3EAF5] bg-[linear-gradient(135deg,#EFF5FF_0%,#F0FFF5_100%)] p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[#071D4A]">
        <CircleHelp className="size-5 text-[#063CCB]" />
        <span className="font-semibold">Precisa de ajuda?</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[#5B6B88]">
        Veja nossas dúvidas frequentes ou fale com nosso suporte.
      </p>
      <Link
        href="/ajuda"
        className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-[9px] border border-[#DCE6F4] bg-white px-4 text-sm font-medium text-[#063CCB] transition-colors hover:bg-[#F5F8FE]"
      >
        Central de ajuda <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
