// Tipos e estado inicial compartilhados pelos formulários de auth.
// Fica FORA de actions.ts porque um módulo "use server" só pode exportar
// funções assíncronas.

export type FormState = {
  status: "idle" | "error" | "success" | "check-email";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialFormState: FormState = { status: "idle" };
