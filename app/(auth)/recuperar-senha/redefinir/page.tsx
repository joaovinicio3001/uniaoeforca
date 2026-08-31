import type { Metadata } from "next";
import { Suspense } from "react";
import { KeyRound } from "lucide-react";

import {
  AuthCard,
  AuthHeader,
  AuthSecurityNotice,
} from "@/components/auth/auth-shell";
import { RedefinirForm } from "./redefinir-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function RedefinirPage() {
  return (
    <>
      <AuthCard>
        <AuthHeader
          icon={KeyRound}
          title="Crie uma nova senha"
          subtitle="Digite o código de 6 dígitos que enviamos por e-mail e escolha a nova senha para voltar a acessar sua conta com segurança."
        />
        <div className="mt-6">
          <Suspense fallback={null}>
            <RedefinirForm />
          </Suspense>
        </div>
      </AuthCard>
      <AuthSecurityNotice />
    </>
  );
}
