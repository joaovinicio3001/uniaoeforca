import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteAccountButton } from "./delete-button";

export const metadata: Metadata = { title: "Privacidade e dados" };

export default async function PrivacidadePainelPage() {
  const user = (await getSessionUser())!;
  const supabase = await createClient();
  const { data: pendingReq } = await supabase
    .from("data_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "deletion")
    .in("status", ["pending", "processing"])
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Privacidade e dados</h1>
        <p className="text-muted-foreground">
          Seus direitos como titular de dados (LGPD). Veja também a{" "}
          <Link href="/privacidade" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Baixar meus dados</CardTitle>
          <CardDescription>
            Exporta um arquivo JSON com seu cadastro, campanhas, contribuições,
            saques e verificações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" variant="outline">
            <a href="/api/me/export" download>
              <Download className="size-4" /> Baixar (JSON)
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Excluir minha conta</CardTitle>
          <CardDescription>
            Removemos seus dados pessoais e anonimizamos os registros que a lei
            exige manter (financeiros/fiscais). A conta é bloqueada
            imediatamente após o processamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton pending={!!pendingReq} />
        </CardContent>
      </Card>
    </div>
  );
}
