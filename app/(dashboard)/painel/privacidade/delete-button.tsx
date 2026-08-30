"use client";

import { useState, useTransition } from "react";

import { requestAccountDeletionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DeleteAccountButton({ pending }: { pending: boolean }) {
  const [isPending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (pending) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Você tem uma solicitação de exclusão em andamento.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {msg && (
        <Alert variant="success">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}
      {!confirm ? (
        <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>
          Solicitar exclusão da conta
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Tem certeza? Registros financeiros são retidos pelo prazo legal e
            anonimizados.
          </span>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() =>
              start(async () => {
                const r = await requestAccountDeletionAction();
                setMsg(r.message);
                setConfirm(false);
              })
            }
          >
            Confirmar solicitação
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
