"use client";

import { useActionState, useState } from "react";

import { requestWithdrawalAction } from "../actions";
import { initialWithdrawalFormState } from "@/lib/withdrawals/form-state";
import { PIX_KEY_TYPE_LABEL, type PixKeyType } from "@/lib/withdrawals/pix-keys";
import { formatBRL } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

type Key = { id: string; type: PixKeyType; masked: string };

export function WithdrawalForm({
  keys,
  availableCents,
  feeCents,
}: {
  keys: Key[];
  availableCents: number;
  feeCents: number;
}) {
  const [state, formAction] = useActionState(
    requestWithdrawalAction,
    initialWithdrawalFormState,
  );
  const [amount, setAmount] = useState(
    (availableCents / 100).toFixed(2).replace(".", ","),
  );

  const amountCents =
    Math.round(Number(amount.replace(/\./g, "").replace(",", ".")) * 100) || 0;
  const net = Math.max(0, amountCents - feeCents);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="pixKeyId">Chave PIX de destino</Label>
        <select
          id="pixKeyId"
          name="pixKeyId"
          required
          defaultValue={keys[0]?.id ?? ""}
          className="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          {keys.map((k) => (
            <option key={k.id} value={k.id}>
              {PIX_KEY_TYPE_LABEL[k.type]} · {k.masked}
            </option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.pixKeyId} />
      </div>

      <div>
        <Label htmlFor="amount">Valor do saque</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Disponível: {formatBRL(availableCents)}
        </p>
        <FieldError errors={state.fieldErrors?.amount} />
      </div>

      <div className="rounded-lg border bg-brand-surface p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor solicitado</span>
          <span className="tabular-nums">{formatBRL(amountCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxa de saque</span>
          <span className="tabular-nums">− {formatBRL(feeCents)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
          <span>Você recebe</span>
          <span className="tabular-nums">{formatBRL(net)}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="password">Confirme sua senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Reautenticação para uma ação sensível (doc §6.2).
        </p>
        <FieldError errors={state.fieldErrors?.password} />
      </div>

      <p className="text-xs text-muted-foreground">
        A solicitação reserva o valor do seu saldo imediatamente e entra em
        análise. Prazo de processamento: até 24 horas (doc §11.3).
      </p>

      <SubmitButton className="w-full" pendingText="Enviando…">
        Solicitar saque
      </SubmitButton>
    </form>
  );
}
