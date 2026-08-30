import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmOtpForm } from "./confirm-otp-form";

export const metadata: Metadata = { title: "Confirmar e-mail" };

export default function ConfirmarPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirme seu e-mail</CardTitle>
        <CardDescription>
          Enviamos um código de 6 dígitos para o seu e-mail. Digite abaixo para
          ativar a sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <ConfirmOtpForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
