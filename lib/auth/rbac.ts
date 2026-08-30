/**
 * RBAC — perfis e permissões (doc §3).
 *
 * Perfis:
 *   visitante   — não autenticado (implícito; nunca gravado em user_roles)
 *   doador      — autenticado, doa e consulta comprovantes
 *   criador     — cria/gerencia campanhas, vê saldo, solicita saque (sujeito a KYC)
 *   analista    — revisa campanhas, KYC, denúncias e saques (NÃO altera ledger)
 *   financeiro  — concilia, aprova/rejeita saques conforme alçada (ações críticas c/ MFA)
 *   admin       — configura taxas, categorias, usuários, campanhas, integrações
 *   superadmin  — gestão de administradores e configs sensíveis
 *
 * Princípio do menor privilégio (doc §15). Este módulo é puro (sem I/O) para
 * ser testável e reutilizável em middleware, RSC, route handlers e no client.
 */

export const APP_ROLES = [
  "doador",
  "criador",
  "analista",
  "financeiro",
  "admin",
  "superadmin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const STAFF_ROLES: readonly AppRole[] = [
  "analista",
  "financeiro",
  "admin",
  "superadmin",
];

/** Papel atribuído a todo novo cadastro (ver trigger handle_new_user). */
export const DEFAULT_SIGNUP_ROLES: readonly AppRole[] = ["doador", "criador"];

export type Permission =
  | "campaign:create"
  | "campaign:review"
  | "campaign:moderate"
  | "kyc:review"
  | "withdrawal:request"
  | "withdrawal:review"
  | "withdrawal:approve"
  | "ledger:read"
  | "ledger:post_manual" // proibido a todos por padrão (doc §12); reservado p/ jobs
  | "reconciliation:manage"
  | "fees:configure"
  | "users:manage"
  | "admin:settings"
  | "admin:manage_admins"
  | "audit:read";

const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  doador: [],
  criador: ["campaign:create", "withdrawal:request", "ledger:read"],
  analista: [
    "campaign:review",
    "campaign:moderate",
    "kyc:review",
    "withdrawal:review",
    "ledger:read",
    "audit:read",
  ],
  financeiro: [
    "campaign:review",
    "kyc:review",
    "withdrawal:review",
    "withdrawal:approve",
    "ledger:read",
    "reconciliation:manage",
    "audit:read",
  ],
  admin: [
    "campaign:review",
    "campaign:moderate",
    "kyc:review",
    "withdrawal:review",
    "withdrawal:approve",
    "ledger:read",
    "reconciliation:manage",
    "fees:configure",
    "users:manage",
    "admin:settings",
    "audit:read",
  ],
  superadmin: [
    "campaign:review",
    "campaign:moderate",
    "kyc:review",
    "withdrawal:review",
    "withdrawal:approve",
    "ledger:read",
    "reconciliation:manage",
    "fees:configure",
    "users:manage",
    "admin:settings",
    "admin:manage_admins",
    "audit:read",
  ],
};

export function isStaff(roles: readonly AppRole[]): boolean {
  return roles.some((r) => STAFF_ROLES.includes(r));
}

export function hasRole(roles: readonly AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}

export function can(roles: readonly AppRole[], permission: Permission): boolean {
  return roles.some((r) => ROLE_PERMISSIONS[r]?.includes(permission));
}

export type Area = "painel" | "admin";

/** Guarda grossa por área usada no middleware. Autorização fina é por `can()`. */
export function canAccessArea(roles: readonly AppRole[], area: Area): boolean {
  if (area === "painel") return true; // qualquer usuário autenticado
  if (area === "admin") return isStaff(roles);
  return false;
}

export function highestRole(roles: readonly AppRole[]): AppRole | "visitante" {
  const order = [...APP_ROLES];
  let best: AppRole | "visitante" = "visitante";
  let bestIdx = -1;
  for (const r of roles) {
    const idx = order.indexOf(r);
    if (idx > bestIdx) {
      bestIdx = idx;
      best = r;
    }
  }
  return best;
}
