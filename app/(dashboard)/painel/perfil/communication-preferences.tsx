"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePreferencesAction } from "./actions";
import { cn } from "@/lib/utils";

type Prefs = { campaignActivity: boolean; platformUpdates: boolean };

const ITEMS: {
  key: keyof Prefs;
  title: string;
  description: string;
}[] = [
  {
    key: "campaignActivity",
    title: "E-mails sobre suas campanhas",
    description: "Receba novidades sobre suas campanhas.",
  },
  {
    key: "platformUpdates",
    title: "Atualizações da plataforma",
    description: "Receba comunicados e atualizações importantes.",
  },
];

export function CommunicationPreferences({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [pending, start] = useTransition();

  function toggle(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const fd = new FormData();
    fd.set("campaignActivity", String(next.campaignActivity));
    fd.set("platformUpdates", String(next.platformUpdates));
    start(async () => {
      const res = await updatePreferencesAction(fd);
      if (res.ok) {
        toast.success(res.message, { duration: 1800 });
      } else {
        setPrefs(prefs); // reverte
        toast.error(res.message);
      }
    });
  }

  return (
    <ul className="space-y-1">
      {ITEMS.map((item) => {
        const on = prefs[item.key];
        return (
          <li
            key={item.key}
            className="flex items-start justify-between gap-4 rounded-[12px] px-1 py-3"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#071D4A]">
                {item.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-[#5B6B88]">
                {item.description}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={item.title}
              disabled={pending}
              onClick={() => toggle(item.key)}
              className={cn(
                "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645D8]/40 focus-visible:ring-offset-2 disabled:opacity-60",
                on ? "bg-[#0645D8]" : "bg-[#CBD5E6]",
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 transform rounded-full bg-white shadow transition-transform",
                  on ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
