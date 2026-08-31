import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { hasServiceRole } from "@/lib/env";
import { listUsers } from "@/lib/admin/users";
import { formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Usuários" };

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; erro?: string }>;
}) {
  const user = await requireStaff();
  const { q = "", erro } = await searchParams;

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const users = await listUsers(q, 60);
  const canManage = can(user.roles, "users:manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">
          Busque por nome, e-mail ou final do CPF.
        </p>
      </div>

      {erro === "sem-permissao" && (
        <Alert variant="destructive">
          <AlertDescription>
            Você não tem permissão para ações administrativas de usuário.
          </AlertDescription>
        </Alert>
      )}

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nome, e-mail ou 3 últimos dígitos do CPF"
          className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm"
        />
        <Button type="submit" size="sm">
          <Search className="size-4" /> Buscar
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>
            {q ? `Resultados para “${q}”` : "Cadastros recentes"} ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Nome</th>
                  <th>E-mail</th>
                  <th>CPF</th>
                  <th>Status</th>
                  <th>Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="py-2 pr-2">
                      <Link
                        href={`/admin/usuarios/${u.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {u.full_name || u.display_name || "—"}
                      </Link>
                    </td>
                    <td className="pr-2 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="pr-2 text-muted-foreground">
                      {u.cpf_last3 ? `•••.${u.cpf_last3}` : "—"}
                    </td>
                    <td className="pr-2">
                      <StatusTag status={u.status} />
                    </td>
                    <td className="text-muted-foreground">
                      {formatDateTimeBR(u.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {!canManage && (
        <p className="text-xs text-muted-foreground">
          Somente leitura. Bloqueio de conta exige o papel de{" "}
          <strong>admin</strong>.
        </p>
      )}
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success",
    pending: "bg-accent/20 text-accent-foreground",
    blocked: "bg-destructive/15 text-destructive",
  };
  const label: Record<string, string> = {
    active: "Ativa",
    pending: "Pendente",
    blocked: "Bloqueada",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {label[status] ?? status}
    </span>
  );
}
