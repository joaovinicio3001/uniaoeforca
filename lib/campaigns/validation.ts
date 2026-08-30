import { z } from "zod";

import { Constants } from "@/lib/database.types";

export const CATEGORY_SLUGS = [
  "saude", "emergencia", "animais", "educacao",
  "familia", "projetos", "esportes", "outros",
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

const UF = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

/** Meta em reais (string do formulário) → centavos inteiros (doc §24). */
const goalReaisToCents = z
  .string()
  .trim()
  .transform((v) =>
    v
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "") // separador de milhar
      .replace(",", "."),
  )
  .pipe(z.coerce.number().positive("Informe uma meta maior que zero."))
  .transform((reais) => Math.round(reais * 100))
  .refine((c) => c >= 5000, "Meta mínima de R$ 50,00.")
  .refine((c) => c <= 500_000_000, "Meta máxima de R$ 5.000.000,00.");

export const campaignDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Título muito curto (mín. 5).")
    .max(120, "Título muito longo (máx. 120)."),
  categorySlug: z.enum(CATEGORY_SLUGS, {
    errorMap: () => ({ message: "Escolha uma categoria." }),
  }),
  summary: z
    .string()
    .trim()
    .min(10, "Resumo muito curto (mín. 10).")
    .max(200, "Resumo muito longo (máx. 200)."),
  story: z.string().max(20000, "História muito longa.").optional().default(""),
  goalAmount: goalReaisToCents,
  city: z.string().trim().max(80).optional().default(""),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (v) => v === "" || (UF as readonly string[]).includes(v),
      "UF inválida.",
    )
    .optional()
    .default(""),
});
export type CampaignDraftInput = z.infer<typeof campaignDraftSchema>;

export const campaignUpdateSchema = z.object({
  title: z.string().trim().min(3, "Título muito curto.").max(140, "Título muito longo."),
  body: z.string().trim().min(1, "Escreva a atualização.").max(10000),
  publishNow: z.boolean().optional().default(true),
});
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

export const reportSchema = z.object({
  reason: z.enum(Constants.public.Enums.report_reason, {
    errorMap: () => ({ message: "Selecione um motivo." }),
  }),
  details: z.string().trim().max(1000).optional().default(""),
});
export type ReportInput = z.infer<typeof reportSchema>;
