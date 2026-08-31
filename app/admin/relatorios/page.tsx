import type { Metadata } from "next";
import { Download } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { hasServiceRole } from "@/lib/env";
import { REPORT_TYPES, REPORT_LABEL } from "@/lib/admin/reports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Relatórios" };

export default async function AdminRelatoriosPage() {
  await requireStaff();

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">
          Exporte movimentações por período em CSV (separador “;”, compatível com
          Excel).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exportar</CardTitle>
          <CardDescription>
            O arquivo é gerado na hora e baixado pelo navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="GET"
            action="/api/admin/relatorios"
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label htmlFor="type" className="mb-1 block text-sm font-medium">
                Tipo de relatório
              </label>
              <select
                id="type"
                name="type"
                defaultValue="donations"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {REPORT_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="from" className="mb-1 block text-sm font-medium">
                De
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={firstOfMonth}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="to" className="mb-1 block text-sm font-medium">
                Até
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={today}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">
                <Download className="size-4" /> Baixar CSV
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Doações e campanhas filtram pela data de criação; saques pela data de
        solicitação; usuários pela data de cadastro. Cada exportação fica
        registrada na auditoria.
      </p>
    </div>
  );
}
