import "server-only";

import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import { serverEnv } from "@/lib/env";
import { onlyDigits } from "@/lib/validation/cpf";

/**
 * Hash determinístico de CPF (com pepper) para deduplicação e busca sem
 * armazenar o valor em claro (doc §18).
 *
 * LIMITAÇÃO: o espaço de CPF é pequeno (~10^11); só o pepper não impede
 * brute-force por quem tiver acesso ao hash + pepper. Na Fase 5 (KYC) trocar
 * por tokenização do PSP e/ou cifra com chave do Supabase Vault.
 */
export function hashCPF(cpf: string): string {
  const digits = onlyDigits(cpf);
  const pepper = serverEnv().CPF_HASH_PEPPER;
  return createHash("sha256").update(`${pepper}:${digits}`).digest("hex");
}

export function cpfLast3(cpf: string): string {
  return onlyDigits(cpf).slice(-3);
}

// ------------------------------------------------------------------
// Cifra simétrica para dados que precisam ser recuperados em claro server-side
// (valor de chave PIX — necessário para o PIX Out). AES-256-GCM.
// Formato: iv(hex):authTag(hex):ciphertext(hex).
// Na Fase 5 migrar para o Supabase Vault (doc §18).
// ------------------------------------------------------------------
function encKey(): Buffer {
  const hex = serverEnv().SECRETS_ENC_KEY;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("SECRETS_ENC_KEY deve ter 64 caracteres hexadecimais (AES-256).");
  }
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Payload cifrado inválido.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

/** Hash determinístico (com pepper) para dedup de chave PIX sem expor o valor. */
export function hashSecret(value: string): string {
  const pepper = serverEnv().CPF_HASH_PEPPER;
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}
