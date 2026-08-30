import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Minhas contribuições" };

const STATUS_LABEL: Record<string, string> = {
  created: "Iniciada",
  pending: "Aguardando pagamento",
  paid: "Confirmada",
  failed: "Falhou",
  expired: "Expirada",
  refunded: "Estornada",
  chargeback: "Chargeback",
};

export default async function ContribuicoesPage() {
  const user = (await getSessionUser())!;
  const supabase = await createClient();
  const { data: donations } = await supabase
    .from("donations")
    .select("id, gross_amount_cents, net_amount_cents, status, created_at, paid_at, campaign_id, campaigns(slug, title)")
    .eq("donor_user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minhas contribuições</h1>
        <p className="text-muted-foreground">
          Histórico das doações feitas com esta conta.
        </p>
      </div>

      {!donations || donations.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Você ainda não fez nenhuma contribuição.{" "}
            <Link href="/campanhas" className="text-primary hover:underline">
              Explorar campanhas
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {donations.map((d) => {
            const camp = d.campaigns as { slug?: string; title?: string } | null;
            return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <Link
                    href={camp?.slug ? `/campanhas/${camp.slug}` : "#"}
                    className="font-medium hover:underline"
                  >
                    {camp?.title ?? "Campanha"}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTimeBR(d.created_at)}
                    {d.status === "pending" && (
                      <>
                        {" · "}
                        <Link
                          href={`/campanhas/${camp?.slug}/contribuir/${d.id}`}
                          className="text-primary hover:underline"
                        >
                          concluir pagamento
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {formatBRL(d.gross_amount_cents)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABEL[d.status] ?? d.status}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
