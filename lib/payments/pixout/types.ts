/**
 * Contrato do provedor de PIX Out (doc §34.4, §34.9). O domínio financeiro
 * nunca importa a GGPix direto — só estas interfaces.
 */

export type PixOutKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP" | "COPIAECOLA";

export type CreatePayoutInput = {
  amountCents: number; // valor líquido a enviar ao beneficiário
  pixKey: string;
  pixKeyType: PixOutKeyType;
  recipientDocument?: string;
  externalId: string; // idempotência (withdrawal id)
  description?: string;
  webhookUrl: string;
};

export type ProviderPayoutStatus =
  | "pending"
  | "complete"
  | "failed"
  | "canceled";

export type Payout = {
  externalRef: string;
  status: ProviderPayoutStatus;
  amountCents: number;
  feeCents: number | null;
  failureReason: string | null;
  raw: unknown;
};

export type PayoutStatus = {
  externalRef: string;
  status: ProviderPayoutStatus;
  amountCents: number | null;
  netAmountCents: number | null;
  feeCents: number | null;
  endToEndId: string | null;
  failureReason: string | null;
  raw: unknown;
};

export type VerifiedPayoutEvent = {
  externalRef: string;
  externalId: string | null;
  status: ProviderPayoutStatus;
  amountCents: number | null;
  raw: unknown;
};

export interface PixOutProvider {
  readonly name: string;
  readonly isMock: boolean;
  createPayout(input: CreatePayoutInput): Promise<Payout>;
  getPayout(externalRef: string): Promise<PayoutStatus>;
  parseWebhook(body: unknown): VerifiedPayoutEvent | null;
}
