import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  HandCoins,
  Mail,
  Megaphone,
  UserRound,
} from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile, type VerificationBadge } from "@/lib/profile/queries";
import { formatBRL } from "@/lib/utils";
import {
  CARD,
  PageHeader,
  SectionCard,
  btnSecondary,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { AvatarUploader } from "./avatar-uploader";
import { PersonalInfoForm } from "./personal-info-form";
import { CommunicationPreferences } from "./communication-preferences";
import { DeleteAccountSection } from "./delete-account-section";

export const metadata: Metadata = { title: "Meu perfil" };

const VERIF: Record<
  VerificationBadge,
  { label: string; className: string }
> = {
  verified: { label: "Conta verificada", className: "bg-[#ECF9F0] text-[#1B8F45]" },
  in_review: {
    label: "Verificação em análise",
    className: "bg-[#FFF8DF] text-[#8A5A12]",
  },
  pending: {
    label: "Verificação pendente",
    className: "bg-[#EEF3FA] text-[#5B6B88]",
  },
};

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export default async function PerfilPage() {
  const profile = await getMyProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Meu perfil"
          subtitle="Gerencie suas informações pessoais e de contato."
        />
        <div className={cn(CARD, "p-8 text-center")}>
          <p className="text-[15px] font-semibold text-[#071D4A]">
            Não foi possível carregar seu perfil.
          </p>
          <Link
            href="/painel/perfil"
            className={cn(btnSecondary, "mt-4 inline-flex")}
          >
            Tentar novamente
          </Link>
        </div>
      </div>
    );
  }

  const user = await getSessionUser();
  const supabase = await createClient();
  const { data: pendingReq } = await supabase
    .from("data_requests")
    .select("id")
    .eq("user_id", user!.id)
    .eq("kind", "deletion")
    .in("status", ["pending", "processing"])
    .maybeSingle();

  const v = VERIF[profile.verification];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Meu perfil"
        subtitle="Gerencie suas informações pessoais e de contato."
      />

      {/* Card superior */}
      <div className={cn(CARD, "p-5 sm:p-6")}>
        <AvatarUploader name={profile.fullName} initialUrl={profile.avatarUrl}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2 className="text-[18px] font-bold text-[#071D4A]">
              {profile.fullName}
            </h2>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold",
                v.className,
              )}
            >
              {v.label}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-[#5B6B88]">
            <Mail className="size-4" /> {profile.email ?? "—"}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#5B6B88]">
            <CalendarDays className="size-4" /> Membro desde{" "}
            {fmtDate(profile.createdAt)}
          </p>
        </AvatarUploader>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Informações pessoais */}
        <SectionCard title="Informações pessoais">
          <p className="mb-4 flex items-center gap-2 text-sm text-[#5B6B88]">
            <UserRound className="size-4 text-[#0645D8]" />
            Mantenha seus dados sempre atualizados.
          </p>
          <PersonalInfoForm
            fullName={profile.fullName}
            email={profile.email}
            emailVerified={profile.emailVerified}
            birthDate={profile.birthDate}
            cpfMasked={profile.cpfMasked}
            phone={profile.phone}
          />
        </SectionCard>

        <div className="space-y-5">
          {/* Resumo da conta */}
          <SectionCard title="Resumo da conta" bodyClassName="p-2">
            <Link
              href="/painel/campanhas"
              className="flex items-center gap-3 rounded-[12px] px-3 py-3 transition-colors hover:bg-[#F5F8FE]"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#EDF4FF] text-[#0645D8]">
                <Megaphone className="size-4" />
              </span>
              <span className="flex-1 text-sm font-medium text-[#071D4A]">
                Campanhas criadas
              </span>
              <span className="font-bold text-[#071D4A]">
                {profile.summary.campaignsCreated}
              </span>
              <ChevronRight className="size-4 text-[#9AA8BF]" />
            </Link>
            <Link
              href="/painel/contribuicoes"
              className="flex items-center gap-3 rounded-[12px] px-3 py-3 transition-colors hover:bg-[#F5F8FE]"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#ECF9F0] text-[#20B85A]">
                <HandCoins className="size-4" />
              </span>
              <span className="flex-1 text-sm font-medium text-[#071D4A]">
                Total contribuído
              </span>
              <span className="font-bold text-[#071D4A]">
                {formatBRL(profile.summary.totalContributedCents)}
              </span>
              <ChevronRight className="size-4 text-[#9AA8BF]" />
            </Link>
          </SectionCard>

          {/* Preferências de comunicação */}
          <SectionCard title="Preferências de comunicação">
            <p className="mb-2 flex items-center gap-2 text-sm text-[#5B6B88]">
              <Bell className="size-4 text-[#0645D8]" />
              Escolha como deseja receber nossas comunicações.
            </p>
            <CommunicationPreferences initial={profile.prefs} />
          </SectionCard>
        </div>
      </div>

      <DeleteAccountSection pending={!!pendingReq} />
    </div>
  );
}
