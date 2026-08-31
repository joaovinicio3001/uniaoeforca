export type CampaignMediaLite = {
  id: string;
  public_url: string;
  isCover: boolean;
};

export type CampaignFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** slug/id úteis para redirecionar após criar/editar */
  campaignId?: string;
  slug?: string;
  /** lista de mídia da campanha — usada pelo wizard para hidratar a etapa de imagens */
  media?: CampaignMediaLite[];
};

export const initialCampaignFormState: CampaignFormState = { status: "idle" };
