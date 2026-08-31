import type { Metadata } from "next";
import { Suspense } from "react";
import { MailCheck } from "lucide-react";

import {
  AuthCard,
  AuthHeader,
  AuthSecurityNotice,
} from "@/components/auth/auth-shell";
import { ConfirmOtpForm } from "./confirm-otp-form";

export const metadata: Metadata = { title: "Confirmar e-mail" };

export default function ConfirmarPage() {
  return (
    <>
      <AuthCard>
        <AuthHeader
          icon={MailCheck}
          title="Confirme seu e-mail"
          subtitle="Enviamos um código de 6 dígitos para o seu e-mail. Digite abaixo para ativar a sua conta."
        />
        <div className="mt-6">
          <Suspense fallback={null}>
            <ConfirmOtpForm />
          </Suspense>
        </div>
      </AuthCard>
      <AuthSecurityNotice />
    </>
  );
}
