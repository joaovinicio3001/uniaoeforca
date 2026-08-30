import { z } from "zod";

import { isValidCPF, onlyDigits } from "@/lib/validation/cpf";

/**
 * Schemas de entrada de autenticação (doc §6.1 Cadastro, §6.2 Regras).
 * Validação com Zod conforme doc §15.
 */

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres.")
  .max(128, "Senha muito longa.")
  .refine((v) => /[a-z]/.test(v), "Inclua ao menos uma letra minúscula.")
  .refine((v) => /[A-Z]/.test(v), "Inclua ao menos uma letra maiúscula.")
  .refine((v) => /\d/.test(v), "Inclua ao menos um número.")
  .refine(
    (v) => /[^A-Za-z0-9]/.test(v),
    "Inclua ao menos um caractere especial.",
  );

/** Força estimada 0..4 para o medidor visual do formulário. */
export function passwordStrength(value: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["muito fraca", "fraca", "razoável", "boa", "forte"] as const;
  return { score: clamped, label: labels[clamped] };
}

const phoneSchema = z
  .string()
  .transform((v) => onlyDigits(v))
  .refine((v) => v.length >= 10 && v.length <= 13, "WhatsApp inválido (DDD + número).");

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(5, "Informe seu nome completo.")
      .max(120, "Nome muito longo.")
      .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome."),
    cpf: z
      .string()
      .transform((v) => onlyDigits(v))
      .refine((v) => v.length === 11, "CPF deve ter 11 dígitos.")
      .refine((v) => isValidCPF(v), "CPF inválido."),
    email: z.string().trim().toLowerCase().email("E-mail inválido."),
    whatsapp: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "É preciso aceitar os Termos e a Política de Privacidade." }),
    }),
    marketingOptIn: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  token: z
    .string()
    .trim()
    .transform((v) => onlyDigits(v))
    .refine((v) => v.length === 6, "O código tem 6 dígitos."),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
