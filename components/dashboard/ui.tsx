import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Tokens compartilhados do painel (mesma linguagem em todas as telas)
 * ------------------------------------------------------------------ */
export const CARD =
  "rounded-[16px] border border-[#DFE7F2] bg-white shadow-[0_4px_18px_rgba(15,40,80,0.04)]";

const TONE = {
  blue: "bg-[#EDF4FF] text-[#0645D8]",
  green: "bg-[#ECF9F0] text-[#20B85A]",
  amber: "bg-[#FFF8DF] text-[#B7791F]",
  purple: "bg-[#F1ECFE] text-[#7A4DE0]",
  slate: "bg-[#EEF3FA] text-[#5B6B88]",
} as const;
export type Tone = keyof typeof TONE;

/* ------------------------------------------------------------------ *
 * Cabeçalho de página
 * ------------------------------------------------------------------ */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[26px] font-bold leading-tight text-[#071D4A] sm:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[15px] text-[#5B6B88]">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Botões consistentes (link ou submit)
 * ------------------------------------------------------------------ */
const BTN_BASE =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[11px] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645D8]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const btnPrimary = cn(
  BTN_BASE,
  "bg-[#0645D8] text-white shadow-[0_8px_20px_rgba(6,69,216,0.22)] hover:bg-[#0B4FE5]",
);
export const btnSecondary = cn(
  BTN_BASE,
  "border border-[#DFE7F2] bg-white text-[#17315C] hover:bg-[#F5F8FE]",
);

export function DashLinkButton({
  href,
  variant = "primary",
  className,
  children,
  target,
}: {
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
  target?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      className={cn(variant === "primary" ? btnPrimary : btnSecondary, className)}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * Card de seção (título + ação opcional + corpo)
 * ------------------------------------------------------------------ */
export function SectionCard({
  title,
  actions,
  children,
  bodyClassName,
  className,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section className={cn(CARD, className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3FA] px-5 py-4">
          {title && (
            <h2 className="text-[17px] font-bold text-[#071D4A]">{title}</h2>
          )}
          {actions}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Stat card (resumo com ícone)
 * ------------------------------------------------------------------ */
export function StatCard({
  icon: Icon,
  tone = "blue",
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className={cn(CARD, "flex items-start gap-4 p-5")}>
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          TONE[tone],
        )}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#5B6B88]">{label}</p>
        <p className="mt-1 text-[22px] font-bold leading-tight text-[#071D4A]">
          {value}
        </p>
        {hint && <p className="mt-0.5 text-[13px] text-[#5B6B88]">{hint}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Banner informativo
 * ------------------------------------------------------------------ */
export function InfoBanner({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warning";
}) {
  const Icon = tone === "warning" ? TriangleAlert : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[14px] border px-4 py-3.5 text-sm leading-relaxed",
        tone === "warning"
          ? "border-[#FBE1A8] bg-[#FFF8DF] text-[#7A5312]"
          : "border-[#CFE0FF] bg-[#EDF4FF] text-[#1B3A70]",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "warning" ? "text-[#B7791F]" : "text-[#0645D8]",
        )}
      />
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Estado vazio
 * ------------------------------------------------------------------ */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#EDF4FF] text-[#0645D8]">
        <Icon className="size-7" />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-[#071D4A]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[14px] text-[#5B6B88]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Badge de status genérico (tom por cor)
 * ------------------------------------------------------------------ */
const BADGE_TONE = {
  green: "bg-[#ECF9F0] text-[#1B8F45]",
  amber: "bg-[#FFF8DF] text-[#8A5A12]",
  slate: "bg-[#EEF3FA] text-[#5B6B88]",
  red: "bg-[#FEECEA] text-[#B42318]",
  blue: "bg-[#EDF4FF] text-[#0645D8]",
} as const;

export function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: keyof typeof BADGE_TONE;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        BADGE_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Item de lista "linha" com chevron (mobile-friendly)
 * ------------------------------------------------------------------ */
export function RowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[12px] border border-[#EEF3FA] bg-white p-4 transition-colors hover:border-[#CBD8EC] hover:bg-[#F7FAFD]"
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRight className="size-4 shrink-0 text-[#9AA8BF]" />
    </Link>
  );
}
