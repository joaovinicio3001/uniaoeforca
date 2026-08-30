import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Segurança da conta" };

export default async function SegurancaPage() {
  const user = (await getSessionUser())!;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Segurança da conta</h1>
        <p className="text-muted-foreground">
          Gerencie sua senha e revise os dados de acesso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados de acesso</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Info label="E-mail" value={user.email ?? "—"} />
          <Info
            label="E-mail verificado"
            value={authUser?.email_confirmed_at ? "Sim" : "Pendente"}
          />
          <Info
            label="Último login"
            value={
              authUser?.last_sign_in_at
                ? formatDateTimeBR(authUser.last_sign_in_at)
                : "—"
            }
          />
          <Info
            label="Conta criada em"
            value={
              authUser?.created_at ? formatDateTimeBR(authUser.created_at) : "—"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>
            Use uma senha forte: 8 caracteres ou mais, com maiúsculas,
            minúsculas, números e símbolos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
