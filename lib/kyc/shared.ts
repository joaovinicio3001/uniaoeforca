/** Constantes de KYC seguras para cliente e servidor (sem `server-only`). */

export const KYC_REQUIRED_KINDS = ["id_front", "id_back", "selfie"] as const;
export type KycDocKind = (typeof KYC_REQUIRED_KINDS)[number];

export const KYC_DOC_LABELS: Record<KycDocKind, string> = {
  id_front: "Documento — frente",
  id_back: "Documento — verso",
  selfie: "Selfie segurando o documento",
};

export type KycUploadState = {
  status: "idle" | "error" | "success";
  message?: string;
  kinds?: KycDocKind[];
};
export const initialKycUploadState: KycUploadState = { status: "idle" };

export const KYC_MAX_DOC_BYTES = 12 * 1024 * 1024;
export const KYC_ACCEPT_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
