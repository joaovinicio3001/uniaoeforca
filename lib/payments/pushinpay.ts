import "server-only";

import { serverEnv } from "@/lib/env";
import type {
  Charge,
  ChargeStatus,
  CreateChargeInput,
  PixInProvider,
  ProviderChargeStatus,
  VerifiedWebhookEvent,
} from "@/lib/payments/types";

/**
 * Adapter Pushin Pay (PIX In). Contrato conforme docs públicas:
 *   base prod:    https://api.pushinpay.com.br/api
 *   base sandbox: https://api-sandbox.pushinpay.com.br/api
 *   POST /pix/cashIn   -> cria cobrança (value em centavos, min 50)
 *   GET  /transactions/{id} -> consulta status (fonte de verdade — doc §8.3)
 *   webhook: POST com { id, value, status, end_to_end_id } — SEM assinatura
 *   documentada. Por isso a confirmação real é sempre via GET autenticado.
 */
const PROD_BASE = "https://api.pushinpay.com.br/api";
const SANDBOX_BASE = "https://api-sandbox.pushinpay.com.br/api";

/** O Pushin Pay retorna o id ora minúsculo (cashIn) ora maiúsculo (transactions).
 *  Normalizamos para minúsculo em todo lugar para casar provider_reference. */
function normId(v: unknown): string {
  return String(v ?? "").toLowerCase();
}

function mapStatus(s: unknown): ProviderChargeStatus {
  switch (String(s ?? "").toLowerCase()) {
    case "paid":
    case "approved":
      return "paid";
    case "expired":
      return "expired";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "failed":
    case "refused":
      return "failed";
    case "pending":
      return "pending";
    default:
      return "created";
  }
}

export class PushinPayProvider implements PixInProvider {
  readonly name = "pushinpay";

  private base(): string {
    const env = serverEnv();
    if (env.PUSHINPAY_BASE_URL) return env.PUSHINPAY_BASE_URL.replace(/\/+$/, "");
    return env.NODE_ENV === "production" ? PROD_BASE : SANDBOX_BASE;
  }

  private headers(): HeadersInit {
    const key = serverEnv().PUSHINPAY_API_KEY;
    if (!key) throw new Error("PUSHINPAY_API_KEY não configurada.");
    return {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async createCharge(input: CreateChargeInput): Promise<Charge> {
    if (input.amountCents < 50) {
      throw new Error("Valor mínimo do PIX é R$ 0,50.");
    }
    const res = await fetch(`${this.base()}/pix/cashIn`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        value: input.amountCents,
        webhook_url: input.webhookUrl,
      }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(
        `Pushin Pay createCharge ${res.status}: ${JSON.stringify(data).slice(0, 300)}`,
      );
    }
    return {
      externalId: normId(data.id),
      status: mapStatus(data.status),
      amountCents: Number(data.value ?? input.amountCents),
      qrCode: String(data.qr_code ?? ""),
      qrCodeBase64: (data.qr_code_base64 as string | undefined) ?? null,
      expiresAt: null,
      raw: data,
    };
  }

  async getCharge(externalId: string): Promise<ChargeStatus> {
    const res = await fetch(`${this.base()}/transactions/${externalId}`, {
      method: "GET",
      headers: this.headers(),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(`Pushin Pay getCharge ${res.status}`);
    }
    return {
      externalId: normId(data.id ?? externalId),
      status: mapStatus(data.status),
      amountCents: data.value != null ? Number(data.value) : NaN,
      endToEndId: (data.end_to_end_id as string | undefined) ?? null,
      payerName: (data.payer_name as string | undefined) ?? null,
      payerDocument:
        (data.payer_national_registration as string | undefined) ?? null,
      raw: data,
    };
  }

  parseWebhook(body: unknown): VerifiedWebhookEvent | null {
    if (!body || typeof body !== "object") return null;
    const b = body as Record<string, unknown>;
    const externalId = b.id != null ? normId(b.id) : "";
    if (!externalId) return null;
    const status = mapStatus(b.status);
    return {
      eventId: `${externalId}:${status}`,
      externalId,
      status,
      amountCents: b.value != null ? Number(b.value) : null,
      raw: body,
    };
  }
}
