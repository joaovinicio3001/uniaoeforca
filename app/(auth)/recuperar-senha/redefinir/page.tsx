import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RedefinirForm } from "./redefinir-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function RedefinirPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>
          Digite o código de 6 dígitos que enviamos por e-mail e escolha a nova
          senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <RedefinirForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
