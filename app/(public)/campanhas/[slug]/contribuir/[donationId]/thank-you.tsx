import Link from "next/link";
import { CheckCircle2, HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/campaigns/share-button";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";

type Props = {
  slug: string;
  campaignTitle: string;
  amountCents: number;
  donationId: string;
  paidAt?: string | null;
  shareUrl: string;
};

/** Tela de agradecimento pós-doação, com resumo/recibo e compartilhamento. */
export function ThankYou({
  slug,
  campaignTitle,
  amountCents,
  donationId,
  paidAt,
  shareUrl,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-9" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Obrigado por ajudar!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua contribuição de <strong>{formatBRL(amountCents)}</strong> foi
          confirmada e já está fazendo diferença.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4 text-sm">
        <p className="mb-2 font-semibold">Comprovante</p>
        <dl className="space-y-1.5">
          <Row label="Campanha" value={campaignTitle} />
          <Row label="Valor" value={formatBRL(amountCents)} />
          <Row
            label="Data"
            value={paidAt ? formatDateTimeBR(paidAt) : formatDateTimeBR(new Date().toISOString())}
          />
          <Row label="Forma de pagamento" value="PIX" />
          <Row label="Código" value={donationId.slice(0, 8).toUpperCase()} />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Guarde este código. O histórico completo fica em{" "}
          <Link href="/painel/contribuicoes" className="text-primary hover:underline">
            Minhas contribuições
          </Link>
          .
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-center text-sm font-medium">
          Ajude ainda mais: compartilhe esta campanha
        </p>
        <ShareButton url={shareUrl} title={campaignTitle} />
        <Button asChild className="w-full" variant="success">
          <Link href={`/campanhas/${slug}`}>
            <HeartHandshake className="size-4" /> Voltar para a campanha
          </Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/painel/contribuicoes">Acompanhar minhas doações</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-words">{value}</dd>
    </div>
  );
}
