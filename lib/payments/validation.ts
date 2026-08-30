import { z } from "zod";

/** Valores sugeridos no formulário (centavos). */
export const PRESET_AMOUNTS_CENTS = [2000, 5000, 10000, 20000, 50000, 100000];

const brlToCents = z
  .string()
  .trim()
  .transform((v) =>
    v
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", "."),
  )
  .pipe(z.coerce.number().positive("Informe um valor válido."))
  .transform((reais) => Math.round(reais * 100))
  .refine((c) => c >= 500, "Doação mínima de R$ 5,00.")
  .refine((c) => c <= 100_000_00, "Doação máxima de R$ 100.000,00 por vez.");

export const donationSchema = z.object({
  amount: brlToCents,
  anonymous: z.boolean().optional().default(false),
  donorName: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().max(280).optional().default(""),
  // Cartão entra na Fase 8; por ora só PIX.
  method: z.literal("pix").default("pix"),
});
export type DonationInput = z.infer<typeof donationSchema>;
