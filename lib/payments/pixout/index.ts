import "server-only";

import { serverEnv } from "@/lib/env";
import type { PixOutProvider } from "@/lib/payments/pixout/types";
import { GGPixProvider } from "@/lib/payments/pixout/ggpix";
import { MockPixOutProvider } from "@/lib/payments/pixout/mock";

let cached: PixOutProvider | null = null;

/** Provedor de PIX Out ativo. `PIXOUT_PROVIDER` (auto|mock|ggpix) manda; em
 *  `auto`, usa GGPix se houver `GGPIX_API_KEY`, senão o mock de dev. */
export function getPixOutProvider(): PixOutProvider {
  if (!cached) {
    const env = serverEnv();
    const useGGPix =
      env.PIXOUT_PROVIDER === "ggpix" ||
      (env.PIXOUT_PROVIDER === "auto" && !!env.GGPIX_API_KEY);
    cached = useGGPix ? new GGPixProvider() : new MockPixOutProvider();
  }
  return cached;
}

export * from "@/lib/payments/pixout/types";
