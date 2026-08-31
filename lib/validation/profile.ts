import { z } from "zod";

import { onlyDigits } from "@/lib/validation/cpf";

/** Telefone BR: aceita com máscara, guarda só os dígitos. Opcional. */
const phoneSchema = z
  .string()
  .trim()
  .transform((v) => onlyDigits(v))
  .refine(
    (v) => v === "" || (v.length >= 10 && v.length <= 13),
    "Telefone inválido (DDD + número).",
  )
  .optional()
  .default("");

const currentYear = new Date().getFullYear();

/** Data de nascimento yyyy-mm-dd. Opcional; se informada, idade plausível. */
const birthDateSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida.")
  .refine((v) => {
    if (v === "") return true;
    const d = new Date(`${v}T00:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    const y = d.getFullYear();
    return y >= currentYear - 120 && y <= currentYear - 16;
  }, "Você precisa ter pelo menos 16 anos.")
  .optional()
  .default("");

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(5, "Informe seu nome completo.")
    .max(120, "Nome muito longo.")
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome."),
  birthDate: birthDateSchema,
  phone: phoneSchema,
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
