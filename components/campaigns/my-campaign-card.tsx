"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  MoreHorizontal,
  Settings2,
  Tag,
} from "lucide-react";

import type { MyCampaignCard } from "@/lib/campaigns/queries";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  PUBLIC_STATUSES,
  type CampaignStatus,
} from "@/lib/campaigns/state-machine";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";
import { CARD } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export function MyCampaignCard({
  c,
  siteUrl,
}: {
  c: MyCampaignCard;
  siteUrl: string;
}) {
  const pct =
    c.goal_amount_cents > 0
      ? Math.min(
          100,
          Math.round((c.raised_amount_cents / c.goal_amount_cents) * 100),
        )
      : 0;
  const manageHref = `/painel/campanhas/${c.id}`;
  const isPublic = PUBLIC_STATUSES.includes(c.status as CampaignStatus);
  const publicUrl = `${siteUrl}/campanhas/${c.slug}`;

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <article className={cn(CARD, "relative overflow-hidden")}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <Link
          href={manageHref}
          className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[12px] bg-[#EEF3FA] sm:aspect-square sm:w-[132px]"
          aria-label={`Gerenciar ${c.title}`}
        >
          {c.coverUrl ? (
            <Image
              src={c.coverUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 132px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-[#9AA8BF]">
              <ImageIcon className="size-6" />
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={manageHref}
                className="block truncate text-[16px] font-bold text-[#071D4A] hover:underline"
              >
                {c.title}
              </Link>
              <p className="mt-0.5 text-[12px] text-[#5B6B88]">
                Atualizada em {formatDateTimeBR(c.updated_at)}
              </p>
              <div className="mt-2">
                <CampaignStatusBadge status={c.status as CampaignStatus} />
              </div>
            </div>

            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Ações da campanha"
                className="flex size-9 items-center justify-center rounded-[9px] border border-[#DFE7F2] bg-white text-[#5B6B88] transition-colors hover:bg-[#F5F8FE]"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-[12px] border border-[#DFE7F2] bg-white p-1.5 shadow-[0_12px_32px_rgba(20,50,100,0.14)]"
                >
                  <Link
                    href={manageHref}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-[#17315C] hover:bg-[#F5F8FE]"
                  >
                    <Settings2 className="size-4" /> Gerenciar campanha
                  </Link>
                  {isPublic && (
                    <>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-[#17315C] hover:bg-[#F5F8FE]"
                      >
                        <ExternalLink className="size-4" /> Ver página pública
                      </a>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={copyLink}
                        className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm text-[#17315C] hover:bg-[#F5F8FE]"
                      >
                        {copied ? (
                          <Check className="size-4 text-[#20B85A]" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                        {copied ? "Link copiado!" : "Copiar link"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-[#E8EEF6]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0645D8] to-[#20B85A] transition-[width] duration-500"
                style={{ width: `${Math.max(pct, 1.5)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between text-sm">
              <span className="font-bold text-[#071D4A]">
                {formatBRL(c.raised_amount_cents)}{" "}
                <span className="font-normal text-[#5B6B88]">arrecadados</span>
              </span>
              <span className="text-[#5B6B88]">
                {pct}% de {formatBRL(c.goal_amount_cents)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EEF3FA] px-4 py-3 text-[12px] text-[#5B6B88] sm:px-5">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          Criada em {formatDateTimeBR(c.created_at).split(",")[0]}
        </span>
        {c.categoryName && (
          <span className="inline-flex items-center gap-1.5">
            <Tag className="size-3.5" />
            {c.categoryName}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <ImageIcon className="size-3.5" />
          {c.mediaCount} {c.mediaCount === 1 ? "imagem" : "imagens"}
        </span>
        <Link
          href={manageHref}
          className="ml-auto inline-flex items-center gap-1 font-semibold text-[#0645D8] hover:underline"
        >
          Ver detalhes <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
