/**
 * Contrato dos provedores de PIX (doc §34.9). O domínio nunca importa
 * Pushin Pay / GGPix direto — só estas interfaces.
 */

export type CreateChargeInput = {
  /** valor bruto em centavos inteiros (doc §24) */
  amountCents: number;
  /** URL de webhook já com o token no path */
  webhookUrl: string;
  /** referência interna (donation id) para rastreio/log */
  reference: string;
};

export type Charge = {
  externalId: string;
  status: ProviderChargeStatus;
  amountCents: number;
  qrCode: string;
  qrCodeBase64: string | null;
  expiresAt: string | null;
  raw: unknown;
};

/** Vocabulário normalizado — cada adapter mapeia o do seu provedor para cá. */
export type ProviderChargeStatus =
  | "created"
  | "pending"
  | "paid"
  | "expired"
  | "canceled"
  | "failed";

export type ChargeStatus = {
  externalId: string;
  status: ProviderChargeStatus;
  amountCents: number;
  endToEndId: string | null;
  payerName: string | null;
  payerDocument: string | null;
  raw: unknown;
};

export type VerifiedWebhookEvent = {
  /** id único do evento para idempotência (provider_reference + status) */
  eventId: string;
  externalId: string;
  status: ProviderChargeStatus;
  amountCents: number | null;
  raw: unknown;
};

export interface PixInProvider {
  readonly name: string;
  createCharge(input: CreateChargeInput): Promise<Charge>;
  getCharge(externalId: string): Promise<ChargeStatus>;
  /**
   * Extrai/valida o mínimo do corpo do webhook. NÃO confia nele como verdade —
   * quem chama deve reconfirmar com getCharge() (doc §8.3).
   */
  parseWebhook(body: unknown): VerifiedWebhookEvent | null;
}
