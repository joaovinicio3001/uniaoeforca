import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CARD, PageHeader } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { DataExportCard } from "./data-export-card";
import { DeleteAccountCard } from "./delete-account-card";

export const metadata: Metadata = { title: "Privacidade e dados" };

export default async function PrivacidadePainelPage() {
  const user = (await getSessionUser())!;
  const supabase = await createClient();
  const { data: pendingReq } = await supabase
    .from("data_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "deletion")
    .in("status", ["pending", "processing"])
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Privacidade e dados"
        subtitle={
          <>
            Seus direitos como titular de dados (LGPD). Veja também a{" "}
            <Link
              href="/privacidade"
              className="font-medium text-[#0645D8] hover:underline"
            >
              Política de Privacidade
            </Link>
            .
          </>
        }
      />

      <DataExportCard />

      <DeleteAccountCard pending={!!pendingReq} />

      <div
        className={cn(
          CARD,
          "flex flex-col gap-3 border-[#DCE8FF] bg-[#F4F8FF] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        )}
      >
        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-[#1B3A70]">
          <Info className="mt-0.5 size-4 shrink-0 text-[#0645D8]" />
          Em conformidade com a LGPD, você pode acessar, corrigir, exportar ou
          pedir a exclusão dos seus dados pessoais, respeitadas as exceções
          legais aplicáveis.
        </p>
        <Link
          href="/privacidade"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0645D8] hover:underline"
        >
          Política de Privacidade <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
