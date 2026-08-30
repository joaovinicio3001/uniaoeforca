export type WithdrawalFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  withdrawalId?: string;
};

export const initialWithdrawalFormState: WithdrawalFormState = { status: "idle" };
