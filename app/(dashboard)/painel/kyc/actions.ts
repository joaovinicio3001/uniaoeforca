"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { submitBasicKyc, submitEnhancedKyc } from "@/lib/kyc/service";
import type { KycFormState } from "@/lib/kyc/form-state";

const basicSchema = z.object({
  fullName: z.string().trim().min(5, "Informe o nome completo.").max(120),
  birthDate: z.coerce
    .date({ errorMap: () => ({ message: "Data inválida." }) })
    .transform((d) => d.toISOString().slice(0, 10)),
});

export async function submitBasicKycAction(
  _prev: KycFormState,
  formData: FormData,
): Promise<KycFormState> {
  const user = await requireUser("/painel/kyc");
  const parsed = basicSchema.safeParse({
    fullName: formData.get("fullName"),
    birthDate: formData.get("birthDate"),
  });
  if (!parsed.success) {
    const fe: Record<string, string[]> = {};
    for (const i of parsed.error.issues)
      (fe[String(i.path[0] ?? "_")] ??= []).push(i.message);
    return { status: "error", message: "Revise os campos.", fieldErrors: fe };
  }

  const res = await submitBasicKyc({
    userId: user.id,
    fullName: parsed.data.fullName,
    birthDate: parsed.data.birthDate,
  });
  if (!res.ok) return { status: "error", message: res.error };

  revalidatePath("/painel/kyc");
  return res.autoApproved
    ? { status: "success", message: "Identidade verificada com sucesso." }
    : {
        status: "review",
        message:
          "Dados enviados. Como não bateram exatamente com o cadastro, um analista vai revisar.",
      };
}

export async function submitEnhancedKycAction(
  _prev: KycFormState,
  formData: FormData,
): Promise<KycFormState> {
  const user = await requireUser("/painel/kyc");
  const files: { kind: "id_front" | "id_back" | "selfie"; file: File }[] = [];
  for (const kind of ["id_front", "id_back", "selfie"] as const) {
    const f = formData.get(kind);
    if (f instanceof File && f.size > 0) files.push({ kind, file: f });
  }
  if (files.length < 2) {
    return {
      status: "error",
      message: "Envie ao menos a frente do documento e a selfie.",
    };
  }

  const res = await submitEnhancedKyc({ userId: user.id, files });
  if (!res.ok) return { status: "error", message: res.error };

  revalidatePath("/painel/kyc");
  return {
    status: "review",
    message: "Documentos enviados. A análise leva até 2 dias úteis.",
  };
}
