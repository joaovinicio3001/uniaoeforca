"use client";

import { useActionState } from "react";
import Link from "next/link";

import { forgotPasswordAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/app/(auth)/form-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/forms/submit-button";

export default function RecuperarSenhaPage() {
  const [state, formAction] = useActionState(
    forgotPasswordAction,
    initialFormState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu e-mail e enviaremos um link para redefinir a senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "success" ? (
          <Alert variant="success">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : (
          <form action={formAction} className="space-y-4" noValidate>
            {state.status === "error" && state.message && (
              <Alert variant="destructive">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1.5"
              />
            </div>
            <SubmitButton className="w-full">Enviar link</SubmitButton>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
