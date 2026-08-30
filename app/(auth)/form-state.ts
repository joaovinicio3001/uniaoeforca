// Tipos e estado inicial compartilhados pelos formulários de auth.
// Fica FORA de actions.ts porque um módulo "use server" só pode exportar
// funções assíncronas.

export type FormState = {
  status: "idle" | "error" | "success" | "check-email";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Valores digitados, devolvidos em caso de erro para não limpar o formulário. */
  values?: Record<string, string>;
  /** true quando o e-mail/CPF já pertence a uma conta. */
  duplicate?: boolean;
};

export const initialFormState: FormState = { status: "idle" };
