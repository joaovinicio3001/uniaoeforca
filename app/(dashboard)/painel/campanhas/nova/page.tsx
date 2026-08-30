import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { createCampaignAction } from "../actions";

export const metadata: Metadata = { title: "Nova campanha" };

export default async function NovaCampanhaPage() {
  await requireUser("/painel/campanhas/nova");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nova campanha</h1>
        <p className="text-muted-foreground">
          Crie o rascunho. Você poderá adicionar imagens e revisar antes de enviar
          para análise.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informações básicas</CardTitle>
          <CardDescription>
            O slug do link público é gerado a partir do título e fica fixo após a
            publicação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm action={createCampaignAction} submitLabel="Criar rascunho" />
        </CardContent>
      </Card>
    </div>
  );
}
