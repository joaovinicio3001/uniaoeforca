import type { Metadata } from "next";

import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { hasServiceRole } from "@/lib/env";
import { getAllSettings } from "@/lib/settings/service";
import { formatDateTimeBR } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { saveSettingsAction } from "./actions";

export const metadata: Metadata = { title: "Configurações" };

function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

export default async function AdminConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const user = await requireStaff();
  const { ok, erro } = await searchParams;
  const canWrite = can(user.roles, "admin:settings");

  if (!hasServiceRole()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <Alert variant="warning">
          <AlertTitle>Configuração pendente</AlertTitle>
          <AlertDescription>
            Defina <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const s = await getAllSettings();
  const val = (k: string) => s.get(k)?.value;
  const lastUpdated = [...s.values()]
    .map((r) => r.updated_at)
    .sort()
    .at(-1);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Parâmetros operacionais da plataforma. Evita valores fixos no código.
        </p>
      </div>

      {ok && (
        <Alert variant="success">
          <AlertDescription>Configurações salvas.</AlertDescription>
        </Alert>
      )}
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>
            {erro === "sem-permissao"
              ? "Você não tem permissão para alterar configurações."
              : decodeURIComponent(erro)}
          </AlertDescription>
        </Alert>
      )}

      <form action={saveSettingsAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Saques</CardTitle>
            <CardDescription>
              Regras aplicadas a novas solicitações de saque.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <IntField
              name="withdrawal_min_cents"
              label="Valor mínimo (centavos)"
              hint="Ex.: 2000 = R$ 20,00"
              defaultValue={num(val("withdrawal_min_cents"), 2000)}
              disabled={!canWrite}
            />
            <IntField
              name="withdrawal_pix_key_cooldown_hours"
              label="Carência da chave PIX (horas)"
              hint="Tempo entre cadastrar a chave e poder sacar para ela."
              defaultValue={num(val("withdrawal_pix_key_cooldown_hours"), 24)}
              disabled={!canWrite}
            />
            <IntField
              name="withdrawal_daily_max_cents"
              label="Teto diário por usuário (centavos)"
              defaultValue={num(val("withdrawal_daily_max_cents"), 200000000)}
              disabled={!canWrite}
            />
            <IntField
              name="release_delay_hours"
              label="Atraso de liberação (horas)"
              hint="Tempo entre a doação confirmar e o valor ficar sacável."
              defaultValue={num(val("release_delay_hours"), 0)}
              disabled={!canWrite}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="maintenance_mode"
                defaultChecked={val("maintenance_mode") === true}
                disabled={!canWrite}
                className="size-4"
              />
              Modo manutenção ativo
            </label>
            <TextField
              name="maintenance_message"
              label="Mensagem de manutenção"
              defaultValue={String(val("maintenance_message") ?? "")}
              disabled={!canWrite}
            />
            <TextField
              name="support_email"
              label="E-mail de suporte (público)"
              defaultValue={String(val("support_email") ?? "")}
              disabled={!canWrite}
            />
          </CardContent>
        </Card>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Última alteração: {formatDateTimeBR(lastUpdated)}
          </p>
        )}

        {canWrite ? (
          <Button type="submit">Salvar configurações</Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Somente leitura. Alterar exige o papel de <strong>admin</strong>.
          </p>
        )}
      </form>
    </div>
  );
}

function IntField({
  name,
  label,
  hint,
  defaultValue,
  disabled,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: number;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        inputMode="numeric"
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  disabled,
}: {
  name: string;
  label: string;
  defaultValue: string;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60"
      />
    </div>
  );
}
