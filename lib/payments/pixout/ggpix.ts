import "server-only";

import { ProxyAgent } from "undici";

import { serverEnv } from "@/lib/env";
import type {
  CreatePayoutInput,
  Payout,
  PayoutStatus,
  PixOutProvider,
  ProviderPayoutStatus,
  VerifiedPayoutEvent,
} from "@/lib/payments/pixout/types";

/**
 * Adapter GGPix (PIX Out). Contrato conforme docs públicas (ggpixapi.com):
 *   base:  https://ggpixapi.com/api/v1  (contingência: https://ggatepixapi.com/api/v1)
 *   auth:  header X-API-Key
 *   POST /pix/out                     -> cria payout (amountCents, min 100)
 *   GET  /transactions/{id}           -> consulta (fonte de verdade — doc §8.3)
 *   status: PENDING | COMPLETE | FAILED | CANCELED
 *   webhook: { transactionId, externalId, status, amount, netAmount, gatewayFee, ... }
 *            SEM assinatura documentada → confirmar sempre via GET autenticado.
 *   IP whitelist OBRIGATÓRIO (painel GGPix).
 */
const DEFAULT_BASE = "https://ggpixapi.com/api/v1";

function mapStatus(s: unknown): ProviderPayoutStatus {
  switch (String(s ?? "").toLowerCase()) {
    case "complete":
    case "completed":
    case "paid":
      return "complete";
    case "failed":
    case "rejected":
      return "failed";
    case "canceled":
    case "cancelled":
      return "canceled";
    default:
      return "pending";
  }
}

export class GGPixProvider implements PixOutProvider {
  readonly name = "ggpix";
  readonly isMock = false;
  private proxy: ProxyAgent | null | undefined;

  private base(): string {
    const b = serverEnv().GGPIX_BASE_URL;
    return (b || DEFAULT_BASE).replace(/\/+$/, "");
  }

  private headers(): HeadersInit {
    const key = serverEnv().GGPIX_API_KEY;
    if (!key) throw new Error("GGPIX_API_KEY não configurada.");
    return {
      "X-API-Key": key,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  /**
   * Chamadas à GGPix precisam sair de um IP estático whitelistado. Se FIXIE_URL
   * estiver definido, roteamos SÓ estas requisições pelo proxy Fixie.
   */
  private fetchInit(init: RequestInit): RequestInit {
    if (this.proxy === undefined) {
      const url = serverEnv().FIXIE_URL;
      this.proxy = url ? new ProxyAgent(url) : null;
    }
    if (!this.proxy) return init;
    return { ...init, dispatcher: this.proxy } as RequestInit;
  }

  async createPayout(input: CreatePayoutInput): Promise<Payout> {
    if (input.amountCents < 100) {
      throw new Error("Valor mínimo do PIX Out é R$ 1,00.");
    }
    const res = await fetch(
      `${this.base()}/pix/out`,
      this.fetchInit({
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          amountCents: input.amountCents,
          pixKey: input.pixKey,
          pixKeyType: input.pixKeyType,
          externalId: input.externalId,
          recipientDocument: input.recipientDocument,
          description: input.description,
          webhookUrl: input.webhookUrl,
        }),
        cache: "no-store",
      }),
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(
        `GGPix createPayout ${res.status}: ${JSON.stringify(data).slice(0, 300)}`,
      );
    }
    const fees = data.fees as { total?: number } | undefined;
    return {
      externalRef: String(data.id),
      status: mapStatus(data.status),
      amountCents: Number(data.amount ?? input.amountCents),
      feeCents: fees?.total != null ? Number(fees.total) : null,
      failureReason: (data.failureReason as string | undefined) ?? null,
      raw: data,
    };
  }

  async getPayout(externalRef: string): Promise<PayoutStatus> {
    const res = await fetch(
      `${this.base()}/transactions/${externalRef}`,
      this.fetchInit({
        method: "GET",
        headers: this.headers(),
        cache: "no-store",
      }),
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(`GGPix getPayout ${res.status}`);
    return {
      externalRef: String(data.id ?? externalRef),
      status: mapStatus(data.status),
      amountCents: data.amount != null ? Number(data.amount) : null,
      netAmountCents: data.netAmount != null ? Number(data.netAmount) : null,
      feeCents: data.gatewayFee != null ? Number(data.gatewayFee) : null,
      endToEndId: (data.endToEndId as string | undefined) ?? null,
      failureReason: (data.failureReason as string | undefined) ?? null,
      raw: data,
    };
  }

  parseWebhook(body: unknown): VerifiedPayoutEvent | null {
    if (!body || typeof body !== "object") return null;
    const b = body as Record<string, unknown>;
    const ref = b.transactionId != null ? String(b.transactionId) : "";
    if (!ref) return null;
    return {
      externalRef: ref,
      externalId: b.externalId != null ? String(b.externalId) : null,
      status: mapStatus(b.status),
      amountCents: b.amount != null ? Number(b.amount) : null,
      raw: body,
    };
  }
}
