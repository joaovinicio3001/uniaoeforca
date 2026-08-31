"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LEGAL_META, type LegalDocument } from "@/lib/legal/versions";
import { acceptPendingConsentsAction } from "@/app/(dashboard)/legal-actions";

export function ConsentBanner({ pending }: { pending: LegalDocument[] }) {
  const [done, setDone] = useState(false);
  const [isPending, start] = useTransition();

  if (done || pending.length === 0) return null;

  return (
    <div className="border-b border-[#F0D9A8] bg-[#FFF8E8]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p className="flex items-start gap-2 text-sm text-[#7A5B12]">
          <FileText className="mt-0.5 size-4 shrink-0" />
          <span>
            Atualizamos{" "}
            {pending.map((d, i) => (
              <span key={d}>
                {i > 0 && (i === pending.length - 1 ? " e " : ", ")}
                <Link
                  href={LEGAL_META[d].href}
                  target="_blank"
                  className="font-medium underline"
                >
                  {LEGAL_META[d].label}
                </Link>
              </span>
            ))}
            . Revise e confirme para continuar usando a plataforma.
          </span>
        </p>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            start(async () => {
              await acceptPendingConsentsAction();
              setDone(true);
            })
          }
          className="shrink-0"
        >
          {isPending ? "Salvando…" : "Li e aceito"}
        </Button>
      </div>
    </div>
  );
}
