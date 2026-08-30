import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentView } from "./payment-view";

export const metadata: Metadata = {
  title: "Pagamento PIX",
  robots: { index: false },
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ slug: string; donationId: string }>;
}) {
  const { slug, donationId } = await params;

  if (!hasServiceRole()) {
    return (
      <div className="container max-w-xl py-10">
        <Alert variant="warning">
          <AlertDescription>
            Configure <code>SUPABASE_SERVICE_ROLE_KEY</code> para processar pagamentos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: donation } = await admin
    .from("donations")
    .select("id, gross_amount_cents, campaign_id, status, campaigns(slug, title)")
    .eq("id", donationId)
    .maybeSingle();

  const camp = donation?.campaigns as { slug?: string; title?: string } | null;
  if (!donation || camp?.slug !== slug) notFound();

  const { data: payment } = await admin
    .from("payments")
    .select("status, qr_code, qr_code_base64")
    .eq("donation_id", donationId)
    .maybeSingle();

  return (
    <div className="container max-w-xl py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/campanhas/${slug}`}>
          <ArrowLeft className="size-4" /> Ir para a campanha
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Pague com PIX para apoiar {camp?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {payment?.qr_code ? (
            <PaymentView
              slug={slug}
              donationId={donation.id}
              amountCents={donation.gross_amount_cents}
              qrCode={payment.qr_code}
              qrCodeBase64={payment.qr_code_base64}
              initialStatus={payment.status}
            />
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Não encontramos a cobrança PIX desta doação. Volte e tente
                novamente.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
