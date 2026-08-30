import type { Metadata } from "next";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";

import { getMyKycSummary } from "@/lib/kyc/queries";
import { formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BasicKycForm, EnhancedKycForm } from "./kyc-forms";

export const metadata: Metadata = { title: "Verificação de identidade" };

export default async function KycPage() {
  const s = await getMyKycSummary();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verificação de identidade (KYC)</h1>
        <p className="text-muted-foreground">
          Necessária antes do primeiro saque e para valores maiores (doc §14).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusCard
          title="Verificação básica"
          done={s.hasBasic}
          pendingText="Confirme nome e data de nascimento."
        />
        <StatusCard
          title="Verificação reforçada"
          done={s.hasEnhanced}
          pendingText="Documento com foto + selfie."
        />
      </div>

      {s.latestCase?.status === "rejected" && s.latestCase.rejection_reason && (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertDescription>
            Última análise reprovada: {s.latestCase.rejection_reason}. Reenvie
            abaixo.
          </AlertDescription>
        </Alert>
      )}
      {["pending", "in_review"].includes(s.latestStatus ?? "") && (
        <Alert variant="warning">
          <Clock className="size-4" />
          <AlertDescription>
            Você tem uma verificação em análise
            {s.latestCase
              ? ` (enviada em ${formatDateTimeBR(s.latestCase.submitted_at)})`
              : ""}
            .
          </AlertDescription>
        </Alert>
      )}

      {!s.hasBasic && (
        <Card>
          <CardHeader>
            <CardTitle>Verificação básica</CardTitle>
            <CardDescription>
              Confirmação instantânea se os dados baterem com o cadastro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BasicKycForm />
          </CardContent>
        </Card>
      )}

      {!s.hasEnhanced && (
        <Card>
          <CardHeader>
            <CardTitle>Verificação reforçada</CardTitle>
            <CardDescription>
              Exigida no primeiro saque e para valores acima do limite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedKycForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusCard({
  title,
  done,
  pendingText,
}: {
  title: string;
  done: boolean;
  pendingText: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        {done ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
        ) : (
          <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {done ? "Aprovada" : pendingText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
