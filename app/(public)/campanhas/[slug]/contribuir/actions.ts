"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getCampaignBySlug } from "@/lib/campaigns/queries";
import { rateLimit } from "@/lib/security/rate-limit";
import { donationSchema } from "@/lib/payments/validation";
import { createDonationWithCharge } from "@/lib/payments/donations";
import type { CampaignFormState } from "@/lib/campaigns/form-state";

export async function createDonationAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const slug = String(formData.get("slug") ?? "");
  const res = await getCampaignBySlug(slug);
  if (res.kind !== "found" || res.campaign.status !== "active") {
    return { status: "error", message: "Esta campanha não está recebendo doações." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const rl = rateLimit(`donate:${ip}`, { limit: 12, windowSeconds: 600 });
  if (!rl.ok) {
    return {
      status: "error",
      message: `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
    };
  }

  const parsed = donationSchema.safeParse({
    amount: formData.get("amount"),
    anonymous: formData.get("anonymous") === "on",
    donorName: formData.get("donorName") ?? "",
    message: formData.get("message") ?? "",
    method: "pix",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) {
      (fieldErrors[String(i.path[0] ?? "_")] ??= []).push(i.message);
    }
    return { status: "error", message: "Revise os dados da doação.", fieldErrors };
  }

  const user = await getSessionUser();
  const input = parsed.data;
  if (!input.anonymous && !input.donorName) {
    input.donorName = user?.displayName ?? user?.fullName ?? "Apoiador";
  }

  const created = await createDonationWithCharge({
    campaignId: res.campaign.id,
    donorUserId: user?.id ?? null,
    input,
  });

  if (!created.ok) {
    return { status: "error", message: created.error };
  }

  redirect(`/campanhas/${slug}/contribuir/${created.donationId}`);
}
