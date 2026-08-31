import { requireUser } from "@/lib/auth/session";
import { getPendingConsents } from "@/lib/legal/service";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ConsentBanner } from "@/components/legal/consent-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/painel");
  const userName =
    user.displayName ?? user.fullName ?? user.email ?? "Usuário";
  const pendingConsents = await getPendingConsents(user.id);

  return (
    <div className="min-h-dvh bg-[#F7FAFE]">
      <ConsentBanner pending={pendingConsents} />
      <DashboardHeader userName={userName} />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:gap-7 lg:px-10 lg:py-10">
        <DashboardSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
