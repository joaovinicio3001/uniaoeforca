import type { Metadata } from "next";
import {
  CalendarDays,
  CircleCheck,
  Clock,
  Mail,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { listMyDevices } from "@/lib/security/devices";
import { formatDateTimeBR } from "@/lib/utils";
import {
  CARD,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { ChangePasswordForm } from "./change-password-form";
import { AccountSessionsCard } from "./account-sessions-card";
import { RecentDevices } from "./recent-devices";

export const metadata: Metadata = { title: "Segurança da conta" };

export default async function SegurancaPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Segurança da conta"
          subtitle="Gerencie sua senha e revise os dados de acesso."
        />
        <div className={cn(CARD, "p-8 text-center")}>
          <p className="text-[15px] font-semibold text-[#071D4A]">
            Não foi possível carregar os dados de segurança.
          </p>
          <a
            href="/painel/seguranca"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-[11px] border border-[#DFE7F2] bg-white px-4 text-sm font-semibold text-[#17315C] hover:bg-[#F5F8FE]"
          >
            Tentar novamente
          </a>
        </div>
      </div>
    );
  }

  const devices = await listMyDevices();
  const verified = !!user.email_confirmed_at;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Segurança da conta"
        subtitle="Gerencie sua senha e revise os dados de acesso."
      />

      {/* Dados de acesso */}
      <SectionCard title="Dados de acesso">
        <div className="grid gap-3 sm:grid-cols-2">
          <AccessItem icon={Mail} label="E-mail">
            <span className="break-all font-semibold text-[#071D4A]">
              {user.email ?? "—"}
            </span>
          </AccessItem>

          <AccessItem
            icon={CircleCheck}
            label="E-mail verificado"
            iconClassName={verified ? "text-[#20B85A]" : "text-[#B7791F]"}
          >
            <StatusPill tone={verified ? "green" : "amber"}>
              {verified ? "Verificado" : "Pendente"}
            </StatusPill>
          </AccessItem>

          <AccessItem icon={Clock} label="Último login">
            <span className="font-semibold text-[#071D4A]">
              {user.last_sign_in_at
                ? formatDateTimeBR(user.last_sign_in_at)
                : "—"}
            </span>
          </AccessItem>

          <AccessItem icon={CalendarDays} label="Conta criada em">
            <span className="font-semibold text-[#071D4A]">
              {user.created_at ? formatDateTimeBR(user.created_at) : "—"}
            </span>
          </AccessItem>
        </div>
      </SectionCard>

      {/* Alterar senha */}
      <SectionCard title="Alterar senha">
        <p className="mb-5 text-sm text-[#5B6B88]">
          Use uma senha forte: 8 caracteres ou mais, com maiúsculas, minúsculas,
          números e símbolos.
        </p>
        <ChangePasswordForm />
      </SectionCard>

      {/* Sessão da conta */}
      <AccountSessionsCard />

      {/* Dispositivos recentes */}
      <RecentDevices
        devices={devices.map((d) => ({
          sessionId: d.sessionId,
          device: d.device,
          isMobile: d.isMobile,
          ipMasked: d.ipMasked,
          lastSeenAt: d.lastSeenAt,
          isCurrent: d.isCurrent,
        }))}
      />
    </div>
  );
}

function AccessItem({
  icon: Icon,
  label,
  iconClassName,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-[#EEF3FA] bg-[#F9FBFE] p-4">
      <Icon className={cn("mt-0.5 size-5 shrink-0 text-[#5B6B88]", iconClassName)} />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#5B6B88]">{label}</p>
        <div className="mt-1 text-sm">{children}</div>
      </div>
    </div>
  );
}
