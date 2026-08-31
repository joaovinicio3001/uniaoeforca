import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { listMyPixKeys } from "@/lib/withdrawals/queries";
import { PIX_KEY_TYPE_LABEL } from "@/lib/withdrawals/pix-keys";
import { serverEnv } from "@/lib/env";
import { formatDateTimeBR } from "@/lib/utils";
import {
  EmptyState,
  InfoBanner,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/dashboard/ui";
import { PixKeyForm } from "./pix-key-form";
import { RemovePixKey } from "./remove-pix-key";

export const metadata: Metadata = { title: "Chaves PIX" };

export default async function ChavesPixPage() {
  const keys = await listMyPixKeys();
  const cooldownHours = serverEnv().WITHDRAWAL_PIX_KEY_COOLDOWN_HOURS;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/painel/saques"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6B88] transition-colors hover:text-[#0645D8]"
      >
        <ArrowLeft className="size-4" /> Voltar para saques
      </Link>

      <PageHeader
        title="Chaves PIX"
        subtitle="Cadastre as chaves PIX que poderão receber os seus saques."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Suas chaves PIX" bodyClassName="p-0">
          {keys.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="Nenhuma chave cadastrada."
              description="Adicione sua primeira chave PIX para receber seus saques."
            />
          ) : (
            <ul className="divide-y divide-[#EEF3FA]">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#071D4A]">
                      {PIX_KEY_TYPE_LABEL[k.type]} · {k.value_masked}
                    </p>
                    {k.owner_name && (
                      <p className="text-[13px] text-[#5B6B88]">{k.owner_name}</p>
                    )}
                    <p className="mt-1 flex items-center gap-2 text-[12px] text-[#5B6B88]">
                      <StatusPill
                        tone={k.status === "verified" ? "green" : "amber"}
                      >
                        {k.status === "verified" ? "Verificada" : "Pendente"}
                      </StatusPill>
                      cadastrada em {formatDateTimeBR(k.created_at)}
                    </p>
                  </div>
                  <RemovePixKey keyId={k.id} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Adicionar chave PIX">
          <p className="mb-4 text-sm text-[#5B6B88]">
            A chave é armazenada de forma segura e usada apenas para os seus
            saques.
          </p>
          <PixKeyForm />
        </SectionCard>
      </div>

      <InfoBanner>
        Por segurança, uma chave recém-cadastrada só fica liberada para saque
        após {cooldownHours} horas. A chave fica guardada de forma cifrada.
      </InfoBanner>
    </div>
  );
}
