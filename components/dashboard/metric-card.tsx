import type { LucideIcon } from "lucide-react";

import { cn, formatBRL } from "@/lib/utils";
import {
  MiniTrendChart,
  type TrendTone,
} from "@/components/dashboard/mini-trend-chart";

const TONE: Record<TrendTone, { iconBg: string; icon: string }> = {
  blue: { iconBg: "bg-[#EAF2FF]", icon: "text-[#063CCB]" },
  green: { iconBg: "bg-[#EAF9EF]", icon: "text-[#23B64B]" },
  yellow: { iconBg: "bg-[#FFF6DA]", icon: "text-[#E09600]" },
  purple: { iconBg: "bg-[#F3EAFE]", icon: "text-[#9747FF]" },
};

/** Card de métrica financeira com ícone colorido e mini-gráfico de tendência. */
export function MetricCard({
  label,
  valueCents,
  icon: Icon,
  tone,
}: {
  label: string;
  valueCents: number;
  icon: LucideIcon;
  tone: TrendTone;
}) {
  const t = TONE[tone];

  return (
    <div className="flex min-h-[180px] flex-col rounded-[18px] border border-[#E2E9F3] bg-white p-[18px] shadow-[0_7px_20px_rgba(20,55,100,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(20,55,100,0.1)] sm:min-h-[200px] sm:p-[22px]">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            t.iconBg,
          )}
        >
          <Icon className={cn("size-5", t.icon)} />
        </span>
        <span className="min-w-0 text-sm font-medium leading-snug text-[#5B6B88]">
          {label}
        </span>
      </div>

      <p className="mt-3 text-[26px] font-bold tabular-nums text-[#071D4A] sm:text-[30px]">
        {formatBRL(valueCents)}
      </p>

      <div className="mt-auto pt-3">
        <MiniTrendChart tone={tone} />
      </div>
    </div>
  );
}
