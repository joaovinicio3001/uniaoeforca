import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCampaignBySlug } from "@/lib/campaigns/queries";
import { getSessionUser } from "@/lib/auth/session";
import { formatBRL } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DonationForm } from "./donation-form";

export const metadata: Metadata = { title: "Contribuir", robots: { index: false } };

export default async function ContribuirPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await getCampaignBySlug(slug);
  if (res.kind !== "found" || res.campaign.status !== "active") notFound();
  const c = res.campaign;
  const user = await getSessionUser();

  return (
    <div className="container max-w-xl py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/campanhas/${slug}`}>
          <ArrowLeft className="size-4" /> Voltar para a campanha
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Ajudar: {c.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatBRL(c.raised_amount_cents)} arrecadados de{" "}
            {formatBRL(c.goal_amount_cents)}
          </p>
        </CardHeader>
        <CardContent>
          <DonationForm
            slug={slug}
            defaultName={user?.displayName ?? user?.fullName ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
