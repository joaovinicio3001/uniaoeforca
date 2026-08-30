import { requireUser } from "@/lib/auth/session";
import { AppTopbar } from "@/components/layout/app-topbar";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/painel");

  return (
    <div className="flex min-h-dvh flex-col bg-brand-surface">
      <AppTopbar user={user} area="painel" />
      <div className="container flex flex-1 gap-6 py-6">
        <aside className="hidden w-60 shrink-0 rounded-xl border bg-card md:block">
          <AppSidebar area="painel" />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
