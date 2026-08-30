import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Marca União & Força.
 * - `full` (padrão): lockup completo (símbolo + wordmark), para fundos claros.
 * - `light`: símbolo + texto branco, para fundos escuros (a wordmark do lockup
 *   é azul-marinho e some sobre a Baleia Azul).
 */
export function Logo({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "light";
}) {
  if (variant === "light") {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        <Image
          src="/logo-mark.png"
          alt=""
          width={512}
          height={512}
          className="h-8 w-8"
          priority
        />
        <span className="text-lg font-bold tracking-tight text-white">
          União <span className="font-normal text-white/70">&amp;</span> Força
        </span>
      </span>
    );
  }

  return (
    <Image
      src="/logo-lockup.png"
      alt="União &amp; Força"
      width={1561}
      height={667}
      className={cn("h-9 w-auto", className)}
      priority
    />
  );
}
