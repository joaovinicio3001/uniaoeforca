import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Casca visual compartilhada por login, cadastro, recuperação e redefinição.
 *
 * Desktop (>= lg): split 50/50 — foto institucional à esquerda, formulário à
 * direita, centralizado vertical e horizontalmente.
 * Tablet/celular (< lg): foto some, o formulário passa a ser protagonista sobre
 * um fundo levemente azulado. Sem scroll horizontal em nenhum ponto.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full bg-[#F7FAFE] lg:grid lg:grid-cols-2">
      <AuthImagePanel />

      {/* Lado do formulário */}
      <div className="relative flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6 lg:min-h-0 lg:py-12">
        <DecorDots />
        <div className="relative z-10 w-full max-w-[460px]">{children}</div>
      </div>
    </div>
  );
}

/** Painel esquerdo só no desktop: foto + overlay azul + frase institucional. */
function AuthImagePanel() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <Image
        src="/auth-bg.jpg"
        alt=""
        fill
        priority
        sizes="50vw"
        className="object-cover object-center"
      />
      {/* Overlay azul, mais forte na base — sem escurecer os rostos no topo. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,40,75,0.05)_20%,rgba(3,48,88,0.40)_60%,rgba(3,53,94,0.95)_100%)]" />

      {/* Detalhes decorativos discretos */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute right-10 top-12 grid grid-cols-4 gap-2 opacity-40">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="size-1.5 rounded-full bg-white/70" />
          ))}
        </div>
        <span className="absolute right-16 top-1/3 size-24 rounded-full border border-white/15" />
        <span className="absolute left-10 top-24 size-2.5 rounded-full bg-[#FFD500]" />
        <span className="absolute right-24 bottom-40 size-2 rounded-full bg-[#23B64B]" />
      </div>

      {/* Frase institucional */}
      <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
        <span
          aria-hidden
          className="block font-serif text-6xl leading-none text-[#FFD500]"
        >
          &ldquo;
        </span>
        <p className="mt-2 max-w-md text-[30px] font-bold leading-tight text-white xl:text-[34px]">
          Juntos fazemos a diferença.
        </p>
        <p className="mt-3 max-w-md text-base leading-relaxed text-white/90">
          A solidariedade move histórias e transforma vidas todos os dias.
        </p>
      </div>
    </div>
  );
}

/** Bolinhas decorativas do lado do formulário (bem sutis). */
function DecorDots() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <span className="absolute -left-6 top-16 size-32 rounded-full bg-[#EFF5FF]" />
      <span className="absolute right-6 top-10 size-2 rounded-full bg-[#0645D8]/25" />
      <span className="absolute right-16 bottom-24 size-2.5 rounded-full bg-[#23B64B]/30" />
      <span className="absolute left-10 bottom-16 size-2 rounded-full bg-[#FFD500]/60" />
      <div className="absolute -right-10 bottom-0 grid grid-cols-5 gap-2 opacity-50">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="size-1.5 rounded-full bg-[#DFE7F2]" />
        ))}
      </div>
    </div>
  );
}

/** Cartão branco central. */
export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-[#DFE7F2] bg-white p-6 shadow-[0_12px_40px_rgba(25,55,100,0.08)] sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

const ICON_TONES = {
  blue: "bg-[#EFF5FF] text-[#0645D8]",
  green: "bg-[#EAF9EF] text-[#23B64B]",
  amber: "bg-[#FFF7DB] text-[#B7791F]",
  red: "bg-[#FFF1F0] text-[#D92D20]",
} as const;

/** Topo do cartão: logo + (ícone) + título + subtítulo, tudo centralizado. */
export function AuthHeader({
  icon: Icon,
  iconTone = "blue",
  title,
  subtitle,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  iconTone?: keyof typeof ICON_TONES;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <Link href="/" aria-label="União & Força — início">
        <Logo className="h-9 w-auto" />
      </Link>

      {Icon && (
        <span
          className={cn(
            "mt-6 inline-flex size-14 items-center justify-center rounded-full",
            ICON_TONES[iconTone],
          )}
        >
          <Icon className="size-7" />
        </span>
      )}

      <h1
        className={cn(
          "text-[24px] font-bold tracking-tight text-[#071D4A] sm:text-[26px]",
          Icon ? "mt-4" : "mt-6",
        )}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mx-auto mt-2 max-w-[340px] text-[15px] leading-relaxed text-[#5B6B88]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Aviso de segurança — abaixo do formulário. Sem afirmações técnicas fortes. */
export function AuthSecurityNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mt-5 flex items-start gap-3 rounded-[14px] border border-[#DCE8FF] bg-[#EFF5FF] p-4",
        className,
      )}
    >
      <ShieldIcon className="mt-0.5 size-5 shrink-0 text-[#0645D8]" />
      <div>
        <p className="text-sm font-semibold text-[#071D4A]">
          Seus dados estão protegidos
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[#5B6B88]">
          Utilizamos medidas de segurança para proteger suas informações.
        </p>
      </div>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
