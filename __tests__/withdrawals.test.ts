import { describe, it, expect } from "vitest";

import {
  normalizePixKey,
  validatePixKey,
  isValidCNPJ,
  maskPixKey,
  toProviderKeyType,
} from "@/lib/withdrawals/pix-keys";
import {
  addPixKeySchema,
  requestWithdrawalSchema,
} from "@/lib/withdrawals/validation";
import { encryptSecret, decryptSecret, hashSecret } from "@/lib/security/crypto";

describe("pix-keys — normalização e validação (doc §11.4)", () => {
  it("normaliza por tipo", () => {
    expect(normalizePixKey("cpf", "529.982.247-25")).toBe("52998224725");
    expect(normalizePixKey("phone", "(11) 98888-7777")).toBe("11988887777");
    expect(normalizePixKey("email", " User@Site.COM ")).toBe("user@site.com");
  });

  it("valida CPF, e-mail, telefone e EVP", () => {
    expect(validatePixKey("cpf", "52998224725")).toBe(true);
    expect(validatePixKey("cpf", "11111111111")).toBe(false);
    expect(validatePixKey("email", "a@b.com")).toBe(true);
    expect(validatePixKey("email", "sem-arroba")).toBe(false);
    expect(validatePixKey("phone", "11988887777")).toBe(true);
    expect(validatePixKey("phone", "123")).toBe(false);
    expect(
      validatePixKey("evp", "123e4567-e89b-12d3-a456-426614174000"),
    ).toBe(true);
  });

  it("valida CNPJ com dígitos verificadores", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11.222.333/0001-80")).toBe(false);
  });

  it("mascara sem revelar a chave inteira", () => {
    const m = maskPixKey("cpf", "52998224725");
    expect(m).toContain("***");
    expect(m).not.toContain("52998224725");
    expect(maskPixKey("email", "joaozinho@gmail.com")).toBe("jo*******@gmail.com");
  });

  it("mapeia tipo interno para o do provedor (maiúsculo)", () => {
    expect(toProviderKeyType("cpf")).toBe("CPF");
    expect(toProviderKeyType("evp")).toBe("EVP");
  });
});

describe("addPixKeySchema", () => {
  it("normaliza o valor e rejeita chave inválida para o tipo", () => {
    const ok = addPixKeySchema.parse({
      type: "cpf",
      value: "529.982.247-25",
      ownerName: "Maria",
    });
    expect(ok.value).toBe("52998224725");
    expect(
      addPixKeySchema.safeParse({ type: "cpf", value: "123" }).success,
    ).toBe(false);
  });
});

describe("requestWithdrawalSchema", () => {
  it("converte valor BRL para centavos e exige senha + chave", () => {
    const p = requestWithdrawalSchema.parse({
      pixKeyId: "123e4567-e89b-12d3-a456-426614174000",
      amount: "1.234,50",
      password: "x",
    });
    expect(p.amount).toBe(123450);
    expect(
      requestWithdrawalSchema.safeParse({
        pixKeyId: "nao-uuid",
        amount: "10,00",
        password: "x",
      }).success,
    ).toBe(false);
    expect(
      requestWithdrawalSchema.safeParse({
        pixKeyId: "123e4567-e89b-12d3-a456-426614174000",
        amount: "10,00",
        password: "",
      }).success,
    ).toBe(false);
  });
});

describe("crypto — chave PIX cifrada em repouso (AES-256-GCM)", () => {
  it("round-trip encrypt/decrypt", () => {
    const plain = "joaozinho@gmail.com";
    const enc = encryptSecret(plain);
    expect(enc).not.toContain(plain);
    expect(enc.split(":")).toHaveLength(3);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("ciphertext difere a cada chamada (IV aleatório)", () => {
    expect(encryptSecret("x")).not.toBe(encryptSecret("x"));
  });

  it("hashSecret é determinístico", () => {
    expect(hashSecret("chave")).toBe(hashSecret("chave"));
    expect(hashSecret("a")).not.toBe(hashSecret("b"));
  });

  it("payload adulterado falha na verificação de tag", () => {
    const enc = encryptSecret("segredo");
    const [iv, tag, data] = enc.split(":") as [string, string, string];
    const tampered = `${iv}:${tag}:${data.slice(0, -2)}00`;
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
