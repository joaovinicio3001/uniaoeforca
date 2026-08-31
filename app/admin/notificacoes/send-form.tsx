"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { sendAdminNotificationAction } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/forms/submit-button";

const initialSendState = { status: "idle" as const };

const field =
  "mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

export function SendNotificationForm() {
  const [state, action] = useActionState(
    sendAdminNotificationAction,
    initialSendState,
  );
  const [target, setTarget] = useState("all");
  const formRef = useRef<HTMLFormElement>(null);
  const last = useRef(state.status);

  useEffect(() => {
    if (state.status === "success" && last.current !== "success") {
      formRef.current?.reset();
      setTarget("all");
    }
    last.current = state.status;
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.status === "success" && state.message && (
        <Alert variant="success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <label htmlFor="target" className="text-sm font-medium">
          Enviar para
        </label>
        <select
          id="target"
          name="target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className={field}
        >
          <option value="all">Todos os usuários</option>
          <option value="user">Um usuário (por e-mail)</option>
        </select>
      </div>

      {target === "user" && (
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            E-mail do destinatário
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            className={field}
            placeholder="pessoa@email.com"
          />
        </div>
      )}

      <div>
        <label htmlFor="title" className="text-sm font-medium">
          Título
        </label>
        <input
          id="title"
          name="title"
          maxLength={120}
          required
          className={field}
          placeholder="Ex.: Manutenção programada"
        />
      </div>

      <div>
        <label htmlFor="body" className="text-sm font-medium">
          Mensagem
        </label>
        <textarea
          id="body"
          name="body"
          rows={4}
          maxLength={600}
          required
          className={field}
          placeholder="Texto que o usuário verá na notificação."
        />
      </div>

      <div>
        <label htmlFor="href" className="text-sm font-medium">
          Link ao clicar (opcional)
        </label>
        <input
          id="href"
          name="href"
          className={field}
          placeholder="/painel/campanhas"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Caminho interno começando com “/”. Deixe em branco para não linkar.
        </p>
      </div>

      <SubmitButton pendingText="Enviando…">Enviar notificação</SubmitButton>
    </form>
  );
}
