export type CampaignFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** slug/id úteis para redirecionar após criar/editar */
  campaignId?: string;
  slug?: string;
};

export const initialCampaignFormState: CampaignFormState = { status: "idle" };
