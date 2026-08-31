import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/campaigns/queries";
import { CampaignWizard } from "@/components/campaigns/wizard/campaign-wizard";

export const metadata: Metadata = { title: "Nova campanha" };

export default async function NovaCampanhaPage() {
  await requireUser("/painel/campanhas/nova");
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/painel/campanhas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6B88] transition-colors hover:text-[#0645D8]"
      >
        <ArrowLeft className="size-4" />
        Minhas campanhas
      </Link>
      <h1 className="mt-3 text-[24px] font-bold text-[#071D4A] sm:text-[28px]">
        Criar campanha
      </h1>
      <p className="mt-1 text-[15px] text-[#5B6B88]">
        Preencha as etapas abaixo. Ao final, sua campanha é enviada para análise
        da nossa equipe.
      </p>

      <div className="mt-6">
        <CampaignWizard
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        />
      </div>
    </div>
  );
}
