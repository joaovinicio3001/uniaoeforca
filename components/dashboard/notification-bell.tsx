"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(dashboard)/painel/notificacoes/actions";
import {
  relativeTime,
  type NotificationView,
} from "@/lib/notifications/render";
import { cn } from "@/lib/utils";

const DOT: Record<NotificationView["tone"], string> = {
  blue: "bg-[#0645D8]",
  green: "bg-[#20B85A]",
  amber: "bg-[#E0A100]",
  red: "bg-[#D92D20]",
};

export function NotificationBell({
  count,
  items,
}: {
  count: number;
  items: NotificationView[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [localItems, setLocalItems] = useState(items);
  const [localCount, setLocalCount] = useState(count);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalItems(items);
    setLocalCount(count);
  }, [items, count]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openItem(n: NotificationView) {
    if (!n.read) {
      setLocalItems((l) =>
        l.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setLocalCount((c) => Math.max(0, c - 1));
      start(async () => {
        await markNotificationReadAction(n.id);
        router.refresh();
      });
    }
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  function markAll() {
    setLocalItems((l) => l.map((x) => ({ ...x, read: true })));
    setLocalCount(0);
    start(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  const badge = localCount > 9 ? "9+" : String(localCount);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          localCount > 0
            ? `Notificações — ${localCount} não lida(s)`
            : "Notificações"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex size-11 items-center justify-center rounded-[10px] border border-[#DCE5F2] bg-white text-[#17315C] transition-colors hover:bg-[#F5F8FE]"
      >
        {localCount > 0 ? (
          <BellRing className="size-5" />
        ) : (
          <Bell className="size-5" />
        )}
        {localCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-[#D92D20] px-1 text-[11px] font-bold leading-[18px] text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[92vw] max-w-[380px] overflow-hidden rounded-[14px] border border-[#DFE7F2] bg-white shadow-[0_20px_50px_rgba(20,50,100,0.18)]"
        >
          <div className="flex items-center justify-between border-b border-[#EEF3FA] px-4 py-3">
            <span className="text-sm font-bold text-[#071D4A]">Notificações</span>
            {localCount > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0645D8] hover:underline"
              >
                <Check className="size-3.5" /> Marcar todas como lidas
              </button>
            )}
          </div>

          <ul className="max-h-[60vh] divide-y divide-[#EEF3FA] overflow-y-auto">
            {localItems.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-[#5B6B88]">
                Você não tem notificações.
              </li>
            ) : (
              localItems.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F7FAFD]",
                      !n.read && "bg-[#F4F8FF]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : DOT[n.tone],
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm text-[#071D4A]",
                            n.read ? "font-medium" : "font-bold",
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-[#9AA8BF]">
                          {relativeTime(n.createdAt)}
                        </span>
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block text-[13px] leading-snug text-[#5B6B88]">
                          {n.body}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <Link
            href="/painel/notificacoes"
            onClick={() => setOpen(false)}
            className="block border-t border-[#EEF3FA] px-4 py-3 text-center text-[13px] font-semibold text-[#0645D8] hover:bg-[#F7FAFD]"
          >
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}
