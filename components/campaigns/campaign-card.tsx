import Link from "next/link";
import Image from "next/image";
import { MapPin, Users } from "lucide-react";

import { formatBRL } from "@/lib/utils";
import { ProgressBar } from "@/components/campaigns/progress-bar";

export type CampaignCardData = {
  slug: string;
  title: string;
  summary: string;
  city: string | null;
  state: string | null;
  goal_amount_cents: number;
  raised_amount_cents: number;
  supporters_count: number;
  status: string;
  categoryName?: string | null;
  coverUrl?: string | null;
};

export function CampaignCard({ c }: { c: CampaignCardData }) {
  const pct =
    c.goal_amount_cents > 0
      ? Math.min(100, Math.round((c.raised_amount_cents / c.goal_amount_cents) * 100))
      : 0;

  return (
    <Link
      href={`/campanhas/${c.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/9] bg-muted">
        {c.coverUrl ? (
          <Image
            src={c.coverUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-navy/10 to-success/10 text-sm text-muted-foreground">
            Sem imagem
          </div>
        )}
        {c.categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium">
            {c.categoryName}
          </span>
        )}
        {c.status === "completed" && (
          <span className="absolute right-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">
            Concluída
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{c.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>

        <div className="mt-auto space-y-2 pt-2">
          <ProgressBar percent={pct} />
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-foreground">
              {formatBRL(c.raised_amount_cents)}
            </span>
            <span className="text-muted-foreground">{pct}% de {formatBRL(c.goal_amount_cents)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" /> {c.supporters_count}
            </span>
            {(c.city || c.state) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {[c.city, c.state].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
