import "server-only";

import type {
  CreatePayoutInput,
  Payout,
  PayoutStatus,
  PixOutProvider,
  VerifiedPayoutEvent,
} from "@/lib/payments/pixout/types";

/**
 * Provedor de PIX Out para desenvolvimento, enquanto não há credenciais GGPix.
 * `createPayout` aceita e devolve status `pending`. A confirmação (complete/failed)
 * é disparada manualmente pelo admin (botão "Simular", visível só quando isMock),
 * que chama `confirm_withdrawal_payout` diretamente.
 */
export class MockPixOutProvider implements PixOutProvider {
  readonly name = "mock";
  readonly isMock = true;

  async createPayout(input: CreatePayoutInput): Promise<Payout> {
    return {
      externalRef: `mock-${input.externalId}`,
      status: "pending",
      amountCents: input.amountCents,
      feeCents: 0,
      failureReason: null,
      raw: { mock: true, ...input },
    };
  }

  async getPayout(externalRef: string): Promise<PayoutStatus> {
    return {
      externalRef,
      status: "pending",
      amountCents: null,
      netAmountCents: null,
      feeCents: 0,
      endToEndId: null,
      failureReason: null,
      raw: { mock: true },
    };
  }

  parseWebhook(): VerifiedPayoutEvent | null {
    return null;
  }
}
