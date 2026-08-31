import type { Metadata } from "next";
import { KeyRound } from "lucide-react";

import {
  AuthCard,
  AuthHeader,
  AuthSecurityNotice,
} from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <>
      <AuthCard>
        <AuthHeader
          icon={KeyRound}
          title="Esqueceu sua senha?"
          subtitle="Não se preocupe. Informe o e-mail da sua conta e enviaremos as instruções para você criar uma nova senha."
        />
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </AuthCard>
      <AuthSecurityNotice />
    </>
  );
}
