import "server-only";

import type { PixInProvider } from "@/lib/payments/types";
import { PushinPayProvider } from "@/lib/payments/pushinpay";

let cached: PixInProvider | null = null;

/** Provedor de PIX In ativo. Hoje: Pushin Pay (doc §34.3). */
export function getPixInProvider(): PixInProvider {
  if (!cached) cached = new PushinPayProvider();
  return cached;
}

export * from "@/lib/payments/types";
