export type ProfileFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** URL nova do avatar após upload bem-sucedido. */
  avatarUrl?: string;
};

export const initialProfileFormState: ProfileFormState = { status: "idle" };
