export type KycFormState = {
  status: "idle" | "error" | "success" | "review";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialKycFormState: KycFormState = { status: "idle" };
