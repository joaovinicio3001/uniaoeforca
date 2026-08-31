"use client";

import { useEffect, useRef, useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Botão de compartilhar a campanha. Abre um menu com redes sociais + copiar
 * link. Em celular, também oferece o compartilhamento nativo do sistema.
 */
export function ShareButton({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNative(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const text = `Apoie: ${title}`;
  const enc = encodeURIComponent;
  const links: { label: string; href: string }[] = [
    {
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${enc(`${text}\n${url}`)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  };

  const native = async () => {
    try {
      await navigator.share({ title, text, url });
      setOpen(false);
    } catch {
      /* usuário cancelou */
    }
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 className="size-4" /> Compartilhar
      </Button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-full overflow-hidden rounded-xl border bg-card p-1.5 shadow-lg">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-secondary"
            >
              {l.label}
            </a>
          ))}
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
          >
            {copied ? (
              <Check className="size-4 text-success" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Link copiado!" : "Copiar link"}
          </button>
          {canNative && (
            <button
              type="button"
              onClick={native}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary"
            >
              Mais opções…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
