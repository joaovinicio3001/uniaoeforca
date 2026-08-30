"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatBRL } from "@/lib/utils";

type Props = {
  slug: string;
  donationId: string;
  amountCents: number;
  qrCode: string;
  qrCodeBase64: string | null;
  initialStatus: string;
};

const TERMINAL = ["paid", "failed", "expired", "refunded", "chargeback"];

export function PaymentView({
  slug,
  donationId,
  amountCents,
  qrCode,
  qrCodeBase64,
  initialStatus,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);
  const stop = useRef(false);

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/payments/${donationId}/status`, {
        cache: "no-store",
      });
      const j = (await r.json()) as { status?: string };
      if (j.status && j.status !== "unknown") setStatus(j.status);
      return j.status;
    } catch {
      return undefined;
    }
  }, [donationId]);

  useEffect(() => {
    if (TERMINAL.includes(status)) return;
    stop.current = false;
    const tick = async () => {
      if (stop.current) return;
      const s = await poll();
      if (!stop.current && !(s && TERMINAL.includes(s))) {
        timer = setTimeout(tick, 4000);
      }
    };
    let timer = setTimeout(tick, 3000);
    return () => {
      stop.current = true;
      clearTimeout(timer);
    };
  }, [poll, status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  };

  if (status === "paid") {
    return (
      <Alert variant="success">
        <Check className="size-4" />
        <AlertTitle>Pagamento confirmado!</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Sua contribuição de <strong>{formatBRL(amountCents)}</strong> foi
            registrada. Obrigado por apoiar.
          </p>
          <Button asChild size="sm">
            <Link href={`/campanhas/${slug}`}>Voltar para a campanha</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "expired" || status === "failed") {
    return (
      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertTitle>
          {status === "expired" ? "PIX expirado" : "Pagamento não concluído"}
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Nenhum valor foi cobrado. Você pode tentar novamente.</p>
          <Button asChild size="sm" variant="outline">
            <Link href={`/campanhas/${slug}/contribuir`}>Tentar de novo</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Valor</p>
        <p className="text-2xl font-bold">{formatBRL(amountCents)}</p>
      </div>

      {qrCodeBase64 && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              qrCodeBase64.startsWith("data:")
                ? qrCodeBase64
                : `data:image/png;base64,${qrCodeBase64}`
            }
            alt="QR Code PIX"
            className="size-56 rounded-lg border bg-white p-2"
          />
        </div>
      )}

      <div>
        <p className="mb-1 text-sm font-medium">PIX copia e cola</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={qrCode}
            className="min-w-0 flex-1 truncate rounded-md border border-input bg-muted px-3 py-2 text-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Aguardando confirmação do pagamento…
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Assim que o provedor confirmar, esta tela atualiza sozinha. Pode fechar e
        acompanhar pela campanha depois.
      </p>
    </div>
  );
}
