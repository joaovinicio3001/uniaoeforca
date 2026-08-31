"use client";

import { Check } from "lucide-react";

import { WIZARD_STEPS } from "@/lib/campaigns/wizard";
import { cn } from "@/lib/utils";

/**
 * Progresso das 6 etapas.
 * Desktop: stepper horizontal com círculos, labels e linhas.
 * Mobile: "Etapa X de 6" + barra de progresso + título da etapa atual.
 */
export function WizardStepper({ current }: { current: number }) {
  const total = WIZARD_STEPS.length;
  const pct = Math.round(((current - 1) / (total - 1)) * 100);

  return (
    <div>
      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-[#0645D8]">
            Etapa {current} de {total}
          </p>
          <p className="text-sm font-medium text-[#5B6B88]">
            {WIZARD_STEPS[current - 1]}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E1E8F2]">
          <div
            className="h-full rounded-full bg-[#0645D8] transition-[width] duration-300"
            style={{ width: `${Math.max(8, pct)}%` }}
          />
        </div>
      </div>

      {/* Desktop / tablet */}
      <ol className="hidden items-center sm:flex">
        {WIZARD_STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center",
                i < total - 1 && "flex-1",
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    done && "border-[#23B64B] bg-[#EAF9EF] text-[#23B64B]",
                    active &&
                      "border-[#0645D8] bg-[#0645D8] text-white shadow-[0_6px_16px_rgba(6,69,216,0.28)]",
                    !done &&
                      !active &&
                      "border-[#E1E8F2] bg-white text-[#9AA8BF]",
                  )}
                >
                  {done ? <Check className="size-4" /> : n}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-medium",
                    active
                      ? "text-[#071D4A]"
                      : done
                        ? "text-[#23B64B]"
                        : "text-[#9AA8BF]",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < total - 1 && (
                <span
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    n < current ? "bg-[#23B64B]" : "bg-[#E1E8F2]",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
