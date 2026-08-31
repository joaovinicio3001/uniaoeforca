import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { signOutAction } from "@/app/(auth)/actions";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import {
  getUnreadNotificationCount,
  listMyNotifications,
} from "@/lib/notifications/queries";
import { renderNotification } from "@/lib/notifications/render";

/** Header do painel. Sticky, branco, com borda inferior. */
export async function DashboardHeader({ userName }: { userName: string }) {
  const [count, rows] = await Promise.all([
    getUnreadNotificationCount(),
    listMyNotifications(10),
  ]);
  const items = rows.map(renderNotification);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7EDF6] bg-white">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 md:h-[88px] md:px-8">
        <div className="flex items-center gap-3">
          <Link href="/painel" aria-label="Painel — início">
            <Logo />
          </Link>
          <span className="hidden h-[30px] items-center rounded-full bg-[#EAF2FF] px-[18px] text-sm font-medium text-[#0645D8] sm:inline-flex">
            Painel
          </span>
        </div>

        {/* Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-sm font-semibold text-[#071D4A] transition-colors hover:bg-[#F5F8FE]"
          >
            {userName}
            <ChevronDown className="size-4 text-[#5B6B88]" />
          </button>
          <NotificationBell count={count} items={items} />
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-[#DCE5F2] bg-white px-4 text-sm font-medium text-[#17315C] transition-colors hover:bg-[#F5F8FE]"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <NotificationBell count={count} items={items} />
          <MobileNav userName={userName} />
        </div>
      </div>
    </header>
  );
}
