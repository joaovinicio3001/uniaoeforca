import { describe, it, expect } from "vitest";

import {
  passwordSchema,
  passwordStrength,
  registerSchema,
  loginSchema,
} from "@/lib/validation/auth";

describe("passwordSchema", () => {
  it("exige tamanho + classes de caractere", () => {
    expect(passwordSchema.safeParse("Sh0rt!").success).toBe(false); // < 8
    expect(passwordSchema.safeParse("semnumeros!!AA").success).toBe(false);
    expect(passwordSchema.safeParse("semespecial123AA").success).toBe(false);
    expect(passwordSchema.safeParse("Senh4Fort3!aaa").success).toBe(true);
  });
});

describe("passwordStrength", () => {
  it("cresce com comprimento e diversidade", () => {
    expect(passwordStrength("aaaaaaaaaa").score).toBeLessThan(2);
    expect(passwordStrength("Abcdefgh1!xyzq").score).toBeGreaterThanOrEqual(3);
  });
});

describe("registerSchema", () => {
  const base = {
    fullName: "Maria Aparecida Souza",
    cpf: "529.982.247-25",
    birthDate: "1990-05-10",
    email: "MARIA@Example.com ",
    whatsapp: "(11) 98888-7777",
    password: "Senh4Fort3!aaa",
    confirmPassword: "Senh4Fort3!aaa",
    acceptTerms: true as const,
  };

  it("normaliza e-mail e telefone e aceita entrada válida", () => {
    const parsed = registerSchema.parse(base);
    expect(parsed.email).toBe("maria@example.com");
    expect(parsed.whatsapp).toBe("11988887777");
  });

  it("recusa CPF inválido", () => {
    const r = registerSchema.safeParse({ ...base, cpf: "111.111.111-11" });
    expect(r.success).toBe(false);
  });

  it("recusa menor de 18 anos", () => {
    const recent = new Date();
    recent.setFullYear(recent.getFullYear() - 15);
    const r = registerSchema.safeParse({
      ...base,
      birthDate: recent.toISOString().slice(0, 10),
    });
    expect(r.success).toBe(false);
  });

  it("recusa senhas divergentes", () => {
    const r = registerSchema.safeParse({
      ...base,
      confirmPassword: "Outr4Senh4!aaa",
    });
    expect(r.success).toBe(false);
  });

  it("exige aceite dos termos", () => {
    const r = registerSchema.safeParse({ ...base, acceptTerms: false });
    expect(r.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita credenciais mínimas e normaliza e-mail", () => {
    const parsed = loginSchema.parse({ email: " User@Site.com ", password: "x" });
    expect(parsed.email).toBe("user@site.com");
  });
});
