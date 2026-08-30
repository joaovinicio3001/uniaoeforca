"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const NON_TERMINAL = ["requested", "under_review", "approved", "processing"];

export function StatusPoller({
  withdrawalId,
  initialStatus,
}: {
  withdrawalId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const last = useRef(initialStatus);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!NON_TERMINAL.includes(initialStatus)) return;
    let stop = false;
    const loop = async () => {
      if (stop) return;
      try {
        const r = await fetch(
          `/api/withdrawals/${withdrawalId}/payout-status`,
          { cache: "no-store" },
        );
        const j = (await r.json()) as { status?: string };
        if (j.status && j.status !== last.current) {
          last.current = j.status;
          router.refresh();
        }
        setTick((t) => t + 1);
      } catch {
        /* ignore */
      }
      if (!stop && NON_TERMINAL.includes(last.current)) {
        timer = setTimeout(loop, 6000);
      }
    };
    let timer = setTimeout(loop, 5000);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [withdrawalId, initialStatus, router]);

  return null;
}
