"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type AccordionItem = {
  icon?: React.ReactNode;
  title: string;
  content: React.ReactNode;
};

/**
 * Lista de seções expansíveis com animação. Clica no título → abre o conteúdo
 * abaixo. Uma seção aberta por vez.
 */
export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: AccordionItem[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border bg-card">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-secondary/40"
            >
              {it.icon && (
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors [&_svg]:size-5",
                    isOpen
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {it.icon}
                </span>
              )}
              <span className="flex-1 text-lg font-semibold text-foreground sm:text-xl">
                {it.title}
              </span>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "space-y-3 px-5 pb-6 text-base leading-relaxed text-foreground/80",
                    it.icon && "sm:pl-[4.5rem]",
                    "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_li]:ml-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6",
                  )}
                >
                  {it.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
