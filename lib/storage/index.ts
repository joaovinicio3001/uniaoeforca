import "server-only";

import { serverEnv } from "@/lib/env";

/**
 * Abstração de storage de mídia pública (doc §34.9: provedores desacoplados do
 * domínio). Em produção a mídia de campanha vai para o Bunny.net (§34.6);
 * enquanto as credenciais não existem, o fallback é o Supabase Storage.
 */
export type StorageProviderName = "supabase" | "bunny";

export type PutObjectInput = {
  /** caminho lógico, ex.: campaigns/{id}/{assetId}.webp */
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
};

export type PutObjectResult = {
  provider: StorageProviderName;
  key: string;
  publicUrl: string;
};

export interface StorageProvider {
  readonly name: StorageProviderName;
  put(input: PutObjectInput): Promise<PutObjectResult>;
  remove(key: string): Promise<void>;
}

let cached: StorageProvider | null = null;

export async function getStorageProvider(): Promise<StorageProvider> {
  if (cached) return cached;
  const env = serverEnv();
  if (env.BUNNY_STORAGE_ZONE && env.BUNNY_STORAGE_API_KEY && env.BUNNY_CDN_URL) {
    const { BunnyStorageProvider } = await import("@/lib/storage/bunny");
    cached = new BunnyStorageProvider();
  } else {
    const { SupabaseStorageProvider } = await import("@/lib/storage/supabase");
    cached = new SupabaseStorageProvider();
  }
  return cached;
}

/** Nome de arquivo aleatório — nunca confiar no nome enviado (doc §34.6). */
export function randomAssetKey(campaignId: string, ext: string): string {
  const rand = crypto.randomUUID().replace(/-/g, "");
  return `campaigns/${campaignId}/${rand}.${ext}`;
}

export function extForMime(mime: string): "jpg" | "png" | "webp" | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}
