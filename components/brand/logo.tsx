import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Marca União & Força.
 * - `full` (padrão): lockup completo (símbolo + wordmark), para fundos claros.
 * - `light`: mesmo lockup do sistema, com a wordmark em branco, para fundos
 *   escuros (a wordmark do lockup padrão é azul-marinho e some sobre eles).
 */
export function Logo({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "light";
}) {
  const src = variant === "light" ? "/logo-lockup-white.png" : "/logo-lockup.png";

  return (
    <Image
      src={src}
      alt="União &amp; Força"
      width={1716}
      height={829}
      className={cn("h-10 w-auto", className)}
      priority
    />
  );
}
