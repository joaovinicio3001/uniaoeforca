import { describe, it, expect } from "vitest";

import { isValidCPF, formatCPF, onlyDigits } from "@/lib/validation/cpf";

describe("cpf", () => {
  it("aceita CPFs com dígitos verificadores válidos", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("52998224725")).toBe(true);
    expect(isValidCPF("111.444.777-35")).toBe(true);
  });

  it("rejeita DV incorreto, tamanho errado e sequências repetidas", () => {
    expect(isValidCPF("529.982.247-24")).toBe(false);
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("00000000000")).toBe(false);
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });

  it("formata progressivamente", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
    expect(formatCPF("529982")).toBe("529.982");
    expect(onlyDigits("529.982.247-25")).toBe("52998224725");
  });
});
