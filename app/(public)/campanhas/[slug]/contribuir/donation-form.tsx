"use client";

import { useActionState, useState } from "react";

import { createDonationAction } from "./actions";
import { initialCampaignFormState } from "@/lib/campaigns/form-state";
import { PRESET_AMOUNTS_CENTS } from "@/lib/payments/validation";
import { formatBRL } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";
import { cn } from "@/lib/utils";

export function DonationForm({
  slug,
  defaultName,
}: {
  slug: string;
  defaultName: string;
}) {
  const [state, formAction] = useActionState(
    createDonationAction,
    initialCampaignFormState,
  );
  const [amount, setAmount] = useState("50,00");
  const [anonymous, setAnonymous] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="slug" value={slug} />

      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label>Valor da doação</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS_CENTS.map((c) => {
            const label = (c / 100).toFixed(2).replace(".", ",");
            const active = amount === label;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setAmount(label)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-secondary",
                )}
              >
                {formatBRL(c)}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <Label htmlFor="amount" className="text-xs text-muted-foreground">
            ou outro valor (R$)
          </Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
          />
          <FieldError errors={state.fieldErrors?.amount} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="anonymous"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        Doar anonimamente (seu nome não aparece na lista de apoiadores)
      </label>

      {!anonymous && (
        <div>
          <Label htmlFor="donorName">Seu nome (como aparecerá)</Label>
          <Input
            id="donorName"
            name="donorName"
            maxLength={80}
            defaultValue={defaultName}
            className="mt-1.5"
            placeholder="Apoiador"
          />
        </div>
      )}

      <div>
        <Label htmlFor="message">Mensagem (opcional)</Label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={280}
          className="mt-1.5 w-full rounded-md border border-input bg-card p-2 text-sm"
          placeholder="Deixe uma palavra de apoio"
        />
        <FieldError errors={state.fieldErrors?.message} />
      </div>

      <div className="rounded-lg bg-brand-surface p-3 text-xs text-muted-foreground">
        Pagamento por <strong>PIX</strong>. Na próxima tela você verá o QR Code e o
        código copia-e-cola. A doação entra na campanha automaticamente assim que
        o pagamento é confirmado.
      </div>

      <SubmitButton variant="success" className="w-full" pendingText="Gerando PIX…">
        Continuar para o pagamento
      </SubmitButton>
    </form>
  );
}
