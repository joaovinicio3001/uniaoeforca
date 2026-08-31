"use client";

import { maskReais } from "@/lib/campaigns/wizard";
import { cn } from "@/lib/utils";

/** Campo de meta financeira com prefixo R$ e máscara BRL. Controlado. */
export function MoneyInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-[11px] border bg-white transition-shadow",
        "border-[#D9E3F0] focus-within:border-[#0645D8] focus-within:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]",
        invalid &&
          "border-[#D92D20] focus-within:border-[#D92D20] focus-within:shadow-[0_0_0_3px_rgba(217,45,32,0.10)]",
      )}
    >
      <span className="pl-3.5 pr-1 text-[15px] font-semibold text-[#5B6B88]">
        R$
      </span>
      <input
        id={id}
        name="goalDisplay"
        inputMode="decimal"
        autoComplete="off"
        placeholder="Ex: 10.000,00"
        value={value}
        onChange={(e) => onChange(maskReais(e.target.value))}
        aria-invalid={invalid || undefined}
        className="h-12 w-full min-w-0 flex-1 rounded-[11px] bg-transparent pr-3 text-[16px] text-[#071D4A] outline-none placeholder:text-[#9AA8BF]"
      />
    </div>
  );
}
