import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import { listMyPixKeys } from "@/lib/withdrawals/queries";
import { PIX_KEY_TYPE_LABEL } from "@/lib/withdrawals/pix-keys";
import { formatDateTimeBR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PixKeyForm } from "./pix-key-form";
import { disablePixKeyAction } from "../actions";

export const metadata: Metadata = { title: "Chaves PIX" };

export default async function ChavesPixPage() {
  const keys = await listMyPixKeys();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/painel/saques">
          <ArrowLeft className="size-4" /> Voltar para saques
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Chaves PIX</h1>
        <p className="text-muted-foreground">
          Cadastre as chaves que poderão receber seus saques (doc §11.4).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas chaves</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma chave cadastrada.
            </p>
          ) : (
            <ul className="divide-y">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {PIX_KEY_TYPE_LABEL[k.type]} · {k.value_masked}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {k.status === "verified" ? "Verificada" : "Pendente"} ·
                      cadastrada em {formatDateTimeBR(k.created_at)}
                    </p>
                  </div>
                  <form action={disablePixKeyAction}>
                    <input type="hidden" name="keyId" value={k.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar chave</CardTitle>
          <CardDescription>
            A chave é armazenada cifrada e usada apenas para o PIX Out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PixKeyForm />
        </CardContent>
      </Card>
    </div>
  );
}
