import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PutObjectInput,
  PutObjectResult,
  StorageProvider,
} from "@/lib/storage";

const BUCKET = "campaign-media";

/**
 * Fallback de desenvolvimento: Supabase Storage (bucket público
 * `campaign-media`, criado na migration 0011). Upload via service_role.
 */
export class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase" as const;

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    const admin = createAdminClient();
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(input.key, Buffer.from(input.body), {
        contentType: input.contentType,
        upsert: true,
        cacheControl: "31536000",
      });
    if (error) throw new Error(`Supabase Storage upload falhou: ${error.message}`);

    const { data } = admin.storage.from(BUCKET).getPublicUrl(input.key);
    return { provider: this.name, key: input.key, publicUrl: data.publicUrl };
  }

  async remove(key: string): Promise<void> {
    const admin = createAdminClient();
    await admin.storage.from(BUCKET).remove([key]);
  }
}
