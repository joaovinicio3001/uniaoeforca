"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CloudUpload, Loader2, Star, Trash2 } from "lucide-react";

import type { CampaignMediaLite } from "@/lib/campaigns/form-state";
import { cn } from "@/lib/utils";
import { FieldError, StepHeader } from "./wizard-ui";

const ACCEPT = "image/jpeg,image/png,image/webp";

type Props = {
  media: CampaignMediaLite[];
  uploading: boolean;
  error?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: (mediaId: string) => Promise<void>;
  onSetCover: (mediaId: string) => Promise<void>;
};

export function StepImages({
  media,
  uploading,
  error,
  onUpload,
  onRemove,
  onSetCover,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await onUpload(file);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function withPending(id: string, fn: () => Promise<void>) {
    setPendingId(id);
    try {
      await fn();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <StepHeader
        title="Adicione imagens à sua campanha"
        subtitle="Imagens ajudam sua campanha a ganhar mais confiança e alcance."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center rounded-[16px] border-2 border-dashed px-4 py-10 text-center transition-colors",
          dragOver
            ? "border-[#0645D8] bg-[#EAF2FF]"
            : "border-[#C6D2E4] bg-[#F7FAFE]",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-[#EAF2FF] text-[#0645D8]">
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <CloudUpload className="size-6" />
          )}
        </span>
        <p className="mt-3 text-[15px] font-semibold text-[#071D4A]">
          Arraste e solte suas imagens aqui
        </p>
        <p className="my-2 text-[13px] text-[#5B6B88]">ou</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#0645D8] bg-white px-5 text-sm font-semibold text-[#0645D8] transition-colors hover:bg-[#EAF2FF] disabled:opacity-60"
        >
          Escolher arquivos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={(e) => void handleFiles(e.target.files)}
          className="sr-only"
          aria-label="Escolher imagens da campanha"
        />
        <p className="mt-3 text-[12px] text-[#5B6B88]">
          JPG, PNG ou WEBP · até 5 MB por imagem
        </p>
      </div>

      <FieldError>{error}</FieldError>

      <div className="mt-6">
        <p className="text-sm font-semibold text-[#071D4A]">
          Suas imagens{media.length > 0 && ` (${media.length})`}
        </p>
        {media.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#5B6B88]">
            Nenhuma imagem adicionada ainda.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {media.map((m) => {
              const rowBusy = pendingId === m.id;
              return (
                <li
                  key={m.id}
                  className="group relative overflow-hidden rounded-[12px] border border-[#E1E8F2] bg-white"
                >
                  <div className="relative aspect-square bg-[#F7FAFE]">
                    <Image
                      src={m.public_url}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    {rowBusy && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Loader2 className="size-5 animate-spin text-[#0645D8]" />
                      </span>
                    )}
                  </div>
                  {m.isCover && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#23B64B] px-2 py-0.5 text-[10px] font-bold text-white">
                      <Star className="size-3" /> Capa
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-1 p-1.5">
                    {m.isCover ? (
                      <span className="px-1.5 text-[11px] font-medium text-[#5B6B88]">
                        Imagem principal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => withPending(m.id, () => onSetCover(m.id))}
                        disabled={rowBusy}
                        className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-[#0645D8] hover:bg-[#EAF2FF] disabled:opacity-50"
                      >
                        Definir capa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => withPending(m.id, () => onRemove(m.id))}
                      disabled={rowBusy}
                      aria-label="Remover imagem"
                      className="ml-auto rounded-md p-1.5 text-[#D92D20] hover:bg-[#FFF1F0] disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
