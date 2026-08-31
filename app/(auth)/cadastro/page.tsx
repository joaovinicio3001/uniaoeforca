import type { Metadata } from "next";
import { Suspense } from "react";
import { UserRoundPlus } from "lucide-react";

import {
  AuthCard,
  AuthHeader,
  AuthSecurityNotice,
} from "@/components/auth/auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <>
      <AuthCard>
        <AuthHeader
          icon={UserRoundPlus}
          title="Criar sua conta"
          subtitle="Leva menos de dois minutos. Você poderá criar campanhas e doar."
        />
        <div className="mt-6">
          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </div>
      </AuthCard>
      <AuthSecurityNotice />
    </>
  );
}
