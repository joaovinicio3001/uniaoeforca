"use client";

import { useEffect } from "react";

import { captureAttribution } from "@/lib/attribution";
import { track } from "@vercel/analytics";

/** Captura a atribuição do anúncio e registra a visita à landing page. */
export function LpTrack() {
  useEffect(() => {
    captureAttribution();
    try {
      track("LandingPageView");
    } catch {
      /* analytics indisponível */
    }
  }, []);
  return null;
}
