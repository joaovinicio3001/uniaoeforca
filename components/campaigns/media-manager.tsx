"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Star, Trash2, UploadCloud } from "lucide-react";

import {
  uploadCampaignImageAction,
  deleteCampaignImageAction,
  setCoverAction,
} from "@/app/(dashboard)/painel/campanhas/actions";
import { initialCampaignFormState } from "@/lib/campaigns/form-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";

export type MediaItem = {
  id: string;
  public_url: string;
  isCover: boolean;
};

export function MediaManager({
  campaignId,
  media,
}: {
  campaignId: string;
  media: MediaItem[];
}) {
  const [state, formAction] = useActionState(
    uploadCampaignImageAction,
    initialCampaignFormState,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="campaignId" value={campaignId} />
        <div>
          <label
            htmlFor="file"
            className="mb-1.5 block text-sm font-medium"
          >
            Adicionar imagem (JPG, PNG ou WebP · até 5 MB)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </div>
        <SubmitButton size="sm" pendingText="Enviando…">
          <UploadCloud className="size-4" /> Enviar
        </SubmitButton>
      </form>

      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma imagem ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            <li
              key={m.id}
              className="group relative overflow-hidden rounded-lg border"
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={m.public_url}
                  alt=""
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              {m.isCover && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-success px-1.5 py-0.5 text-[10px] font-semibold text-success-foreground">
                  <Star className="size-3" /> Capa
                </span>
              )}
              <div className="flex items-center justify-between gap-1 p-1.5">
                {!m.isCover && (
                  <form action={setCoverAction}>
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="mediaId" value={m.id} />
                    <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      Definir capa
                    </Button>
                  </form>
                )}
                <form action={deleteCampaignImageAction} className="ml-auto">
                  <input type="hidden" name="campaignId" value={campaignId} />
                  <input type="hidden" name="mediaId" value={m.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
