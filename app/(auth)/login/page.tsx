import type { Metadata } from "next";
import { Suspense } from "react";
import { LogIn } from "lucide-react";

import {
  AuthCard,
  AuthHeader,
  AuthSecurityNotice,
} from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <>
      <AuthCard>
        <AuthHeader
          icon={LogIn}
          title="Entrar na sua conta"
          subtitle="Acesse seu painel para gerenciar campanhas, saldo e saques."
        />
        <div className="mt-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </AuthCard>
      <AuthSecurityNotice />
    </>
  );
}
