"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { appendAttribution } from "@/lib/attribution";
import { track } from "@vercel/analytics";

type Variant = "primary" | "outline" | "white";
type Size = "lg" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#0645D8] text-white shadow-[0_10px_24px_rgba(6,69,216,0.22)] hover:bg-[#0B4FE5]",
  outline:
    "border border-[#DFE7F2] bg-white text-[#0645D8] hover:border-[#0645D8]/40",
  white: "bg-white text-[#0645D8] hover:bg-white/90",
};
const SIZES: Record<Size, string> = {
  lg: "h-[52px] px-6 text-[15px]",
  md: "h-11 px-4 text-sm",
};

export function LpCta({
  href,
  children,
  location,
  variant = "primary",
  size = "lg",
  arrow = true,
  className,
}: {
  href: string;
  children: ReactNode;
  location: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        try {
          track("CreateCampaignCTA", { location });
        } catch {
          /* analytics indisponível */
        }
        const dest = appendAttribution(href);
        if (dest !== href) {
          e.preventDefault();
          window.location.assign(dest);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645D8]/40 focus-visible:ring-offset-2",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
      {arrow && <ArrowRight className="size-4 shrink-0" />}
    </a>
  );
}
