import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { getKycCaseForReview } from "@/lib/kyc/queries";
import { formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { reviewKycAction } from "../actions";

export const metadata: Metadata = { title: "Revisar KYC" };

export default async function AdminKycReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const data = await getKycCaseForReview(id);
  if (!data) notFound();

  const { kycCase: kc, profile, documents } = data;
  const nameMatch =
    (kc.full_name_submitted ?? "").trim().toLowerCase() ===
    (profile?.full_name ?? "").trim().toLowerCase();
  const dobMatch =
    String(kc.birth_date_submitted ?? "") === String(profile?.birth_date ?? "");
  const terminal = ["approved", "rejected"].includes(kc.status);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/kyc">
          <ArrowLeft className="size-4" /> Fila
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">
          KYC {kc.level === "enhanced" ? "reforçado" : "básico"}
        </h1>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize">
          {kc.status}
        </span>
      </div>

      {ok && (
        <Alert variant="success">
          <AlertDescription>Decisão registrada ({ok}).</AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>
            {erro === "motivo-obrigatorio"
              ? "Informe um motivo (mín. 5 caracteres) para reprovar."
              : decodeURIComponent(erro)}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados enviados × cadastro</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Cmp label="Nome (enviado)" a={kc.full_name_submitted ?? "—"} ok={nameMatch} />
          <Cmp label="Nome (cadastro)" a={profile?.full_name ?? "—"} ok={nameMatch} />
          <Cmp
            label="Nascimento (enviado)"
            a={kc.birth_date_submitted ?? "—"}
            ok={dobMatch}
          />
          <Cmp
            label="Nascimento (cadastro)"
            a={profile?.birth_date ?? "—"}
            ok={dobMatch}
          />
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">CPF (cadastro)</p>
            <p className="font-medium">•••.{profile?.cpf_last3 ?? "???"}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Enviado em</p>
            <p className="font-medium">{formatDateTimeBR(kc.submitted_at)}</p>
          </div>
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {documents.map((d) => (
              <a
                key={d.id}
                href={d.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border p-3 text-center text-sm hover:bg-secondary"
              >
                <span className="capitalize">{d.kind.replace("_", " ")}</span>
                <span className="mt-1 block text-xs text-primary">abrir</span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {!terminal && (
        <Card>
          <CardHeader>
            <CardTitle>Decisão</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={reviewKycAction} className="space-y-3">
              <input type="hidden" name="caseId" value={id} />
              <div>
                <label htmlFor="riskLevel" className="mb-1 block text-sm font-medium">
                  Nível de risco
                </label>
                <select
                  id="riskLevel"
                  name="riskLevel"
                  defaultValue="low"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="low">Baixo</option>
                  <option value="medium">Médio</option>
                  <option value="high">Alto</option>
                </select>
              </div>
              <textarea
                name="reason"
                rows={2}
                placeholder="Motivo (obrigatório se reprovar)"
                className="w-full rounded-md border border-input bg-card p-2 text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" name="decision" value="approved" variant="success" size="sm">
                  Aprovar
                </Button>
                <Button type="submit" name="decision" value="rejected" variant="destructive" size="sm">
                  Reprovar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Cmp({ label, a, ok }: { label: string; a: string; ok: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium ${ok ? "" : "text-destructive"}`}>{a}</p>
    </div>
  );
}
