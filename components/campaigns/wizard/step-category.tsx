"use client";

import { Check } from "lucide-react";

import { CATEGORY_META, isCategorySlug } from "@/lib/campaigns/wizard";
import { cn } from "@/lib/utils";
import { FieldError, StepHeader } from "./wizard-ui";

type Props = {
  categories: { slug: string; name: string }[];
  value: string;
  onChange: (slug: string) => void;
  error?: string;
};

export function StepCategory({ categories, value, onChange, error }: Props) {
  return (
    <div>
      <StepHeader
        title="Para quem ou para o que é esta campanha?"
        subtitle="Escolha a categoria que melhor representa sua causa."
      />

      <fieldset>
        <legend className="sr-only">Categoria da campanha</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((cat) => {
            const meta = isCategorySlug(cat.slug)
              ? CATEGORY_META[cat.slug]
              : null;
            const Icon = meta?.icon;
            const selected = value === cat.slug;
            return (
              <label
                key={cat.slug}
                className={cn(
                  "relative flex cursor-pointer items-start gap-3 rounded-[14px] border p-4 transition-all",
                  selected
                    ? "border-[#0645D8] bg-[#EAF2FF] shadow-[0_6px_18px_rgba(6,69,216,0.12)]"
                    : "border-[#E1E8F2] bg-white hover:border-[#B9CDF2] hover:bg-[#F7FAFE]",
                )}
              >
                <input
                  type="radio"
                  name="wz-category"
                  value={cat.slug}
                  checked={selected}
                  onChange={() => onChange(cat.slug)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
                    selected
                      ? "bg-[#0645D8] text-white"
                      : "bg-[#EAF2FF] text-[#0645D8]",
                  )}
                >
                  {Icon ? <Icon className="size-5" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[#071D4A]">
                    {cat.name}
                  </span>
                  {meta && (
                    <span className="mt-0.5 block text-[13px] leading-snug text-[#5B6B88]">
                      {meta.description}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 transition-colors",
                    selected
                      ? "border-[#0645D8] bg-[#0645D8] text-white"
                      : "border-[#CBD8EC] bg-white",
                  )}
                >
                  {selected && <Check className="size-3" />}
                </span>
              </label>
            );
          })}
        </div>
        <FieldError>{error}</FieldError>
      </fieldset>
    </div>
  );
}
