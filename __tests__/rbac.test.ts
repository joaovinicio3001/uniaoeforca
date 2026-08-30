import { describe, it, expect } from "vitest";

import {
  can,
  canAccessArea,
  highestRole,
  isStaff,
  type AppRole,
} from "@/lib/auth/rbac";

describe("rbac", () => {
  it("visitante (sem papéis) não acessa admin nem tem permissões", () => {
    const roles: AppRole[] = [];
    expect(isStaff(roles)).toBe(false);
    expect(canAccessArea(roles, "admin")).toBe(false);
    expect(canAccessArea(roles, "painel")).toBe(true); // rota exige só auth
    expect(can(roles, "campaign:create")).toBe(false);
  });

  it("criador pode criar campanha e solicitar saque, mas não revisar", () => {
    const roles: AppRole[] = ["doador", "criador"];
    expect(can(roles, "campaign:create")).toBe(true);
    expect(can(roles, "withdrawal:request")).toBe(true);
    expect(can(roles, "withdrawal:review")).toBe(false);
    expect(can(roles, "withdrawal:approve")).toBe(false);
    expect(canAccessArea(roles, "admin")).toBe(false);
  });

  it("analista revisa mas NÃO aprova saque nem configura taxas (doc §3)", () => {
    const roles: AppRole[] = ["analista"];
    expect(isStaff(roles)).toBe(true);
    expect(canAccessArea(roles, "admin")).toBe(true);
    expect(can(roles, "withdrawal:review")).toBe(true);
    expect(can(roles, "withdrawal:approve")).toBe(false);
    expect(can(roles, "fees:configure")).toBe(false);
    expect(can(roles, "ledger:post_manual")).toBe(false);
  });

  it("financeiro aprova saque e concilia; não gerencia usuários", () => {
    const roles: AppRole[] = ["financeiro"];
    expect(can(roles, "withdrawal:approve")).toBe(true);
    expect(can(roles, "reconciliation:manage")).toBe(true);
    expect(can(roles, "users:manage")).toBe(false);
    expect(can(roles, "admin:manage_admins")).toBe(false);
  });

  it("ninguém lança no ledger manualmente por padrão (doc §12)", () => {
    for (const r of [
      "doador",
      "criador",
      "analista",
      "financeiro",
      "admin",
      "superadmin",
    ] as AppRole[]) {
      expect(can([r], "ledger:post_manual")).toBe(false);
    }
  });

  it("apenas superadmin gerencia administradores", () => {
    expect(can(["admin"], "admin:manage_admins")).toBe(false);
    expect(can(["superadmin"], "admin:manage_admins")).toBe(true);
  });

  it("highestRole escolhe o papel mais alto", () => {
    expect(highestRole([])).toBe("visitante");
    expect(highestRole(["doador", "criador"])).toBe("criador");
    expect(highestRole(["criador", "admin", "analista"])).toBe("admin");
    expect(highestRole(["admin", "superadmin"])).toBe("superadmin");
  });
});
