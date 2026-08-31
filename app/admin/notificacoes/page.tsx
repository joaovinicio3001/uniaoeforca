import type { Metadata } from "next";

import { requireStaff } from "@/lib/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SendNotificationForm } from "./send-form";

export const metadata: Metadata = { title: "Enviar notificação" };

export default async function AdminNotificacoesPage() {
  await requireStaff();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enviar notificação</h1>
        <p className="text-muted-foreground">
          Publica um aviso da equipe nas notificações do painel do usuário.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova notificação</CardTitle>
          <CardDescription>
            Chega em tempo real na próxima carga do painel do destinatário. Não
            envia e-mail — é só a notificação in-app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SendNotificationForm />
        </CardContent>
      </Card>
    </div>
  );
}
