import { isValidCPF, onlyDigits } from "@/lib/validation/cpf";
import type { Database } from "@/lib/database.types";

export type PixKeyType = Database["public"]["Enums"]["pix_key_type"];

/** Normaliza o valor da chave conforme o tipo (puro). */
export function normalizePixKey(type: PixKeyType, raw: string): string {
  const v = raw.trim();
  switch (type) {
    case "cpf":
    case "cnpj":
    case "phone":
      return onlyDigits(v);
    case "email":
      return v.toLowerCase();
    case "evp":
      return v.toLowerCase();
  }
}

export function isValidCNPJ(input: string): boolean {
  const c = onlyDigits(input);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (base: string) => {
    const w = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base
      .split("")
      .reduce((s, d, i) => s + Number(d) * w[i]!, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(c.slice(0, 12));
  const d2 = calc(c.slice(0, 12) + d1);
  return d1 === Number(c[12]) && d2 === Number(c[13]);
}

/** Valida o formato da chave já normalizada (puro). */
export function validatePixKey(type: PixKeyType, value: string): boolean {
  switch (type) {
    case "cpf":
      return isValidCPF(value);
    case "cnpj":
      return isValidCNPJ(value);
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    case "phone":
      return value.length >= 10 && value.length <= 13;
    case "evp":
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        value,
      );
  }
}

/** Máscara para exibição (nunca mostra a chave inteira). */
export function maskPixKey(type: PixKeyType, value: string): string {
  switch (type) {
    case "cpf": {
      const d = onlyDigits(value);
      return `***.***.${d.slice(6, 9)}-${d.slice(9)}`;
    }
    case "cnpj": {
      const d = onlyDigits(value);
      return `**.***.***/${d.slice(8, 12)}-${d.slice(12)}`;
    }
    case "phone": {
      const d = onlyDigits(value);
      return `(${d.slice(-11, -9) || "  "}) *****-${d.slice(-4)}`;
    }
    case "email": {
      const [u, dom] = value.split("@");
      const head = (u ?? "").slice(0, 2);
      return `${head}${"*".repeat(Math.max(1, (u ?? "").length - 2))}@${dom ?? ""}`;
    }
    case "evp":
      return `${value.slice(0, 8)}…${value.slice(-4)}`;
  }
}

/** Tipo GGPix (maiúsculo) a partir do tipo interno. */
export function toProviderKeyType(
  type: PixKeyType,
): "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP" {
  return type.toUpperCase() as "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";
}

export const PIX_KEY_TYPE_LABEL: Record<PixKeyType, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  phone: "Telefone",
  evp: "Chave aleatória",
};
