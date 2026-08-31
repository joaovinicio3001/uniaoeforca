"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellOff, Check } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./actions";
import {
  relativeTime,
  type NotificationView,
} from "@/lib/notifications/render";
import { CARD, EmptyState } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const DOT: Record<NotificationView["tone"], string> = {
  blue: "bg-[#0645D8]",
  green: "bg-[#20B85A]",
  amber: "bg-[#E0A100]",
  red: "bg-[#D92D20]",
};

export function NotificationsList({ items }: { items: NotificationView[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [, start] = useTransition();

  const unreadCount = list.filter((n) => !n.read).length;
  const shown = useMemo(
    () => (tab === "unread" ? list.filter((n) => !n.read) : list),
    [list, tab],
  );

  function open(n: NotificationView) {
    if (!n.read) {
      setList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      start(async () => {
        await markNotificationReadAction(n.id);
        router.refresh();
      });
    }
    if (n.href) router.push(n.href);
  }

  function markAll() {
    setList((l) => l.map((x) => ({ ...x, read: true })));
    start(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[10px] border border-[#DFE7F2] bg-white p-1">
          {(["all", "unread"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-[7px] px-3 py-1.5 text-sm font-semibold transition-colors",
                tab === t
                  ? "bg-[#0645D8] text-white"
                  : "text-[#5B6B88] hover:text-[#071D4A]",
              )}
            >
              {t === "all" ? "Todas" : `Não lidas${unreadCount ? ` (${unreadCount})` : ""}`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0645D8] hover:underline"
          >
            <Check className="size-4" /> Marcar todas como lidas
          </button>
        )}
      </div>

      <div className={cn(CARD, "overflow-hidden")}>
        {shown.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={
              tab === "unread"
                ? "Nenhuma notificação não lida"
                : "Você não tem notificações"
            }
            description="Avisos sobre doações, saques e verificação aparecem aqui."
          />
        ) : (
          <ul className="divide-y divide-[#EEF3FA]">
            {shown.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F7FAFD] sm:px-5",
                    !n.read && "bg-[#F4F8FF]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2.5 shrink-0 rounded-full",
                      n.read ? "bg-[#DDE5F0]" : DOT[n.tone],
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span
                        className={cn(
                          "text-[15px] text-[#071D4A]",
                          n.read ? "font-medium" : "font-bold",
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[12px] text-[#9AA8BF]">
                        {relativeTime(n.createdAt)}
                      </span>
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-sm leading-snug text-[#5B6B88]">
                        {n.body}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
