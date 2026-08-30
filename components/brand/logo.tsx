import { cn } from "@/lib/utils";

/**
 * Marca União & Força. Wordmark original (doc §32: "Não copiar HTML/CSS/textos/
 * assets de plataformas existentes"). Dois nós entrelaçados = "união".
 */
export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7"
        role="img"
        aria-label="União & Força"
      >
        <circle cx="12" cy="16" r="8" fill="none" stroke="#06356B" strokeWidth="3" />
        <circle cx="20" cy="16" r="8" fill="none" stroke="#05B76B" strokeWidth="3" />
        <circle cx="16" cy="16" r="2.5" fill="#FDBD22" />
      </svg>
      {withText && (
        <span className="text-base font-bold tracking-tight text-foreground">
          União <span className="text-success">&amp;</span> Força
        </span>
      )}
    </span>
  );
}
