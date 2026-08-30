import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/session";
import { hasServiceRole } from "@/lib/env";
import { listKycQueue } from "@/lib/kyc/queries";
import { formatDateTimeBR } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Fila de KYC" };

export default async function AdminKycPage() {
  await requireStaff();
  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Fila de KYC</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rows = await listKycQueue();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fila de KYC</h1>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Nenhum caso aguardando análise.
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/kyc/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-secondary/50"
              >
                <div>
                  <p className="font-medium">
                    {c.full_name_submitted ?? "—"}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      · {c.level === "enhanced" ? "reforçada" : "básica"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    enviado {formatDateTimeBR(c.submitted_at)}
                  </p>
                </div>
                <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-medium">
                  {c.status === "in_review" ? "em análise" : "pendente"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
