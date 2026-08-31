import { requireUser } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/painel");
  const userName =
    user.displayName ?? user.fullName ?? user.email ?? "Usuário";

  return (
    <div className="min-h-dvh bg-[#F7FAFE]">
      <DashboardHeader userName={userName} />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:gap-7 lg:px-10 lg:py-10">
        <DashboardSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
