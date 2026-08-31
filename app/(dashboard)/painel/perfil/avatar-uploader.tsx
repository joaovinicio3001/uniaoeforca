"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

import { updateAvatarAction } from "./actions";
import { initialProfileFormState } from "@/lib/profile/form-state";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function AvatarUploader({
  name,
  initialUrl,
  size = 72,
  children,
}: {
  name: string;
  initialUrl: string | null;
  size?: number;
  children?: React.ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const shown = preview ?? url;

  function onPick(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem precisa ter no máximo 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const fd = new FormData();
    fd.set("avatar", file);
    start(async () => {
      const res = await updateAvatarAction(initialProfileFormState, fd);
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      if (res.status === "success" && res.avatarUrl) {
        setUrl(res.avatarUrl);
        toast.success(res.message ?? "Foto atualizada.");
      } else {
        toast.error(res.message ?? "Não foi possível enviar essa imagem.");
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div
        className="relative shrink-0 overflow-hidden rounded-full bg-[#E4ECFB]"
        style={{ width: size, height: size }}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt=""
            className={cn(
              "size-full object-cover",
              pending && "opacity-60",
            )}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[22px] font-bold text-[#0645D8]">
            {initials(name)}
          </span>
        )}
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#0645D8]" />
          </span>
        )}
      </div>

      {children && <div className="min-w-0 flex-1">{children}</div>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={cn(
          "inline-flex min-h-[40px] items-center gap-2 rounded-[10px] border border-[#DFE7F2] bg-white px-3.5 text-sm font-semibold text-[#17315C] transition-colors hover:bg-[#F5F8FE] disabled:opacity-60",
          children && "shrink-0 self-start sm:self-center",
        )}
      >
        <Pencil className="size-4" />
        {pending ? "Enviando…" : "Alterar foto"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onPick(e.target.files?.[0])}
        className="sr-only"
        aria-label="Escolher foto de perfil"
      />
    </div>
  );
}
