"use client";

import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "8 caracteres ou mais", test: (v) => v.length >= 8 },
  { label: "Ao menos 1 letra maiúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Ao menos 1 letra minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Ao menos 1 número", test: (v) => /\d/.test(v) },
  { label: "Ao menos 1 símbolo", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/** Regras reais de `passwordSchema` (lib/validation/auth.ts), com estado ao vivo. */
export function PasswordTips({ value }: { value: string }) {
  return (
    <aside className="rounded-[14px] border border-[#DCE8FF] bg-[#EDF4FF] p-5">
      <div className="flex items-center gap-2 text-[#071D4A]">
        <Lock className="size-4 text-[#0645D8]" />
        <span className="text-sm font-bold">Dicas para uma senha forte</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {RULES.map((rule) => {
          const ok = value.length > 0 && rule.test(value);
          return (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-2 text-[13px]",
                ok ? "text-[#1B8F45]" : "text-[#5B6B88]",
              )}
            >
              {ok ? (
                <Check className="size-4 shrink-0" />
              ) : (
                <span className="size-4 shrink-0 rounded-full border border-[#C6D2E4]" />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
