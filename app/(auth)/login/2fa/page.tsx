import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";

import {
  AuthCard,
  AuthHeader,
  AuthSecurityNotice,
} from "@/components/auth/auth-shell";
import { TwoFactorLoginForm } from "./two-factor-login-form";

export const metadata: Metadata = { title: "Verificação em duas etapas" };

export default function Login2faPage() {
  return (
    <>
      <AuthCard>
        <AuthHeader
          icon={ShieldCheck}
          title="Verificação em duas etapas"
          subtitle="Digite o código de 6 dígitos do seu app autenticador."
        />
        <div className="mt-6">
          <Suspense fallback={null}>
            <TwoFactorLoginForm />
          </Suspense>
        </div>
      </AuthCard>
      <AuthSecurityNotice />
    </>
  );
}
