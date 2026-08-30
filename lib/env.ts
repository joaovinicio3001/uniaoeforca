import { z } from "zod";

/**
 * Validação de ambiente. Separa o que é público (exposto ao browser, prefixo
 * NEXT_PUBLIC_) do que é estritamente server-side (segredos).
 *
 * Regra da doc §34.7: SUPABASE_SERVICE_ROLE_KEY nunca vai ao browser.
 * Por isso `serverEnv` só pode ser importado de código server-side.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(""),
});

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Opcional em dev/test (algumas telas server-side ficam desabilitadas sem ela),
  // obrigatória em produção.
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  // Pepper para o hash de CPF (doc §18). Em produção DEVE ser um segredo forte.
  CPF_HASH_PEPPER: z
    .string()
    .min(16)
    .optional()
    .default("dev-only-pepper-troque-em-producao-uniaoeforca"),
  SENTRY_DSN: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default(""),
  // Segredo para autenticar os jobs agendados (Vercel Cron).
  CRON_SECRET: z.string().optional().default(""),
  // Provedores — preenchidos nas fases 1/2/4.
  BUNNY_STORAGE_ZONE: z.string().optional().default(""),
  BUNNY_STORAGE_API_KEY: z.string().optional().default(""),
  BUNNY_CDN_URL: z.string().optional().default(""),
  BUNNY_STORAGE_HOST: z.string().optional().default("storage.bunnycdn.com"),
  PUSHINPAY_API_KEY: z.string().optional().default(""),
  PUSHINPAY_WEBHOOK_SECRET: z.string().optional().default(""),
  // Vazio → escolhe sandbox/produção por NODE_ENV.
  PUSHINPAY_BASE_URL: z.string().optional().default(""),
  // Custo do provedor de PIX In (Pushin Pay) por transação (doc §9): tarifa fixa
  // de R$ 0,35, sem percentual. Reconciliado depois com o extrato real.
  PUSHINPAY_FEE_BPS: z.coerce.number().int().min(0).max(10000).optional().default(0),
  PUSHINPAY_FEE_MIN_CENTS: z.coerce.number().int().min(0).optional().default(35),
  GGPIX_API_KEY: z.string().optional().default(""),
  GGPIX_WEBHOOK_SECRET: z.string().optional().default(""),
  // Vazio → https://ggpixapi.com/api/v1 (contingência: https://ggatepixapi.com/api/v1)
  GGPIX_BASE_URL: z.string().optional().default(""),
  // Proxy de saída (Fixie) para as chamadas à GGPix saírem de um IP estático
  // whitelistado. Vazio = conexão direta.
  FIXIE_URL: z.string().optional().default(""),
  // auto = GGPix se houver key, senão mock. Força mock/ggpix quando quiser
  // testar o fluxo sem disparar PIX Out real.
  PIXOUT_PROVIDER: z.enum(["auto", "mock", "ggpix"]).optional().default("auto"),
  // Chave AES-256 (64 hex) para cifrar valores de chave PIX em repouso.
  // Em produção DEVE ser um segredo forte e estável (rotação exige recifrar).
  SECRETS_ENC_KEY: z
    .string()
    .optional()
    .default("0".repeat(64)),
  WITHDRAWAL_MIN_CENTS: z.coerce.number().int().min(1).optional().default(2000),
  WITHDRAWAL_MAX_CENTS: z.coerce.number().int().min(1).optional().default(500000000),
  WITHDRAWAL_DAILY_MAX_CENTS: z.coerce.number().int().min(1).optional().default(200000000),
  WITHDRAWAL_PIX_KEY_COOLDOWN_HOURS: z.coerce.number().int().min(0).optional().default(24),
  // Acima deste valor, o saque exige KYC reforçado (doc §14).
  KYC_ENHANCED_THRESHOLD_CENTS: z.coerce.number().int().min(1).optional().default(200000),
  // Acima deste valor, o saque exige dupla aprovação (dois analistas — doc §14).
  WITHDRAWAL_HIGH_VALUE_CENTS: z.coerce.number().int().min(1).optional().default(500000),
});

function parseOrThrow<T extends z.ZodTypeAny>(schema: T, source: unknown): z.infer<T> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n${issues}\n` +
        `Confira o .env.example e crie um .env.local.`,
    );
  }
  return parsed.data;
}

// Referências literais para o Next.js conseguir fazer o inline no bundle do client.
export const publicEnv = parseOrThrow(publicSchema, {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

let _serverEnv: z.infer<typeof serverSchema> | null = null;

/** Só chame a partir de código server-side (RSC, route handlers, server actions). */
export function serverEnv(): z.infer<typeof serverSchema> {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() foi chamado no client. Isso vazaria segredos.");
  }
  if (!_serverEnv) {
    _serverEnv = parseOrThrow(serverSchema, process.env);
  }
  return _serverEnv;
}

export function hasServiceRole(): boolean {
  return serverEnv().SUPABASE_SERVICE_ROLE_KEY.length > 0;
}
