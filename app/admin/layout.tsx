import { requireStaff } from "@/lib/auth/session";
import { AppTopbar } from "@/components/layout/app-topbar";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guarda dupla: middleware + revalidação server-side (doc §34.7).
  const user = await requireStaff();

  return (
    <div className="flex min-h-dvh flex-col bg-brand-surface">
      <AppTopbar user={user} area="admin" />
      <div className="container flex flex-1 gap-6 py-6">
        <aside className="hidden w-60 shrink-0 rounded-xl border bg-card md:block">
          <AppSidebar area="admin" />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
