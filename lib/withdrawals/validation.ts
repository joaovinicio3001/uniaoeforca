import { z } from "zod";

import { Constants } from "@/lib/database.types";
import { normalizePixKey, validatePixKey } from "@/lib/withdrawals/pix-keys";

export const addPixKeySchema = z
  .object({
    type: z.enum(Constants.public.Enums.pix_key_type, {
      errorMap: () => ({ message: "Escolha o tipo da chave." }),
    }),
    value: z.string().trim().min(3, "Informe a chave.").max(140),
    ownerName: z.string().trim().max(120).optional().default(""),
  })
  .transform((d) => ({ ...d, value: normalizePixKey(d.type, d.value) }))
  .refine((d) => validatePixKey(d.type, d.value), {
    path: ["value"],
    message: "Chave PIX inválida para o tipo escolhido.",
  });
export type AddPixKeyInput = z.infer<typeof addPixKeySchema>;

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
  .transform((reais) => Math.round(reais * 100));

export const requestWithdrawalSchema = z.object({
  pixKeyId: z.string().uuid("Selecione uma chave PIX."),
  amount: brlToCents,
  // Reautenticação leve (doc §6.2, §11.4): senha atual.
  password: z.string().min(1, "Confirme sua senha."),
});
export type RequestWithdrawalInput = z.infer<typeof requestWithdrawalSchema>;
