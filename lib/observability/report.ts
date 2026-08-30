import "server-only";

import { serverEnv } from "@/lib/env";

/**
 * Reporte de erro leve (doc §17.1). Se SENTRY_DSN estiver definido, envia o
 * evento ao endpoint de ingestão do Sentry (Store API). Sem SDK — mantém o
 * bundle enxuto. No-op quando não configurado.
 */
type DsnParts = { host: string; projectId: string; publicKey: string };

function parseDsn(dsn: string): DsnParts | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\/+/, "");
    if (!projectId || !u.username) return null;
    return { host: u.host, projectId, publicKey: u.username };
  } catch {
    return null;
  }
}

export async function reportError(
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const dsn = serverEnv().SENTRY_DSN;
  const parsed = dsn ? parseDsn(dsn) : null;
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  // Sempre loga no stdout (capturado pela plataforma).
  console.error("[error]", message, context ?? "", stack ?? "");

  if (!parsed) return;
  try {
    await fetch(
      `https://${parsed.host}/api/${parsed.projectId}/store/?sentry_key=${parsed.publicKey}&sentry_version=7`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          platform: "node",
          level: "error",
          logger: "uniaoeforca",
          message,
          exception: {
            values: [{ type: "Error", value: message, stacktrace: { frames: [] } }],
          },
          extra: { ...context, stack },
        }),
        cache: "no-store",
      },
    );
  } catch {
    /* não deixa o reporte derrubar o fluxo */
  }
}
