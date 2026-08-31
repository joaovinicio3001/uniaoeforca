import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn(
        "h-[6px] w-full overflow-hidden rounded-full bg-[#E8EEF6]",
        className,
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-[#23B64B] transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
