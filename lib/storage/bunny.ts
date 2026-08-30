import "server-only";

import { serverEnv } from "@/lib/env";
import type {
  PutObjectInput,
  PutObjectResult,
  StorageProvider,
} from "@/lib/storage";

/**
 * Bunny.net Storage + CDN (doc §34.6). Endpoints/headers seguem a documentação
 * pública do Bunny Storage API. Ajustar `BUNNY_STORAGE_HOST` se a zona estiver
 * numa região específica (ex.: br.storage.bunnycdn.com).
 */
export class BunnyStorageProvider implements StorageProvider {
  readonly name = "bunny" as const;

  private cfg() {
    const env = serverEnv();
    return {
      zone: env.BUNNY_STORAGE_ZONE,
      key: env.BUNNY_STORAGE_API_KEY,
      cdn: env.BUNNY_CDN_URL.replace(/\/+$/, ""),
      host: env.BUNNY_STORAGE_HOST,
    };
  }

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    const { zone, key, cdn, host } = this.cfg();
    const url = `https://${host}/${zone}/${input.key}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        AccessKey: key,
        "Content-Type": input.contentType,
      },
      body: Buffer.from(input.body),
    });
    if (!res.ok) {
      throw new Error(`Bunny upload falhou: ${res.status} ${await res.text()}`);
    }
    return {
      provider: this.name,
      key: input.key,
      publicUrl: `${cdn}/${input.key}`,
    };
  }

  async remove(key: string): Promise<void> {
    const { zone, key: accessKey, host } = this.cfg();
    const url = `https://${host}/${zone}/${key}`;
    await fetch(url, { method: "DELETE", headers: { AccessKey: accessKey } });
  }
}
