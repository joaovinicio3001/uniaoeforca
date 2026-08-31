"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { uploadKycDocAction } from "./actions";
import { initialKycUploadState, type KycDocKind } from "@/lib/kyc/shared";
import { downscaleImage } from "@/lib/images/downscale";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 12 * 1024 * 1024;

type Status = "idle" | "working" | "done" | "error";

export function DocumentUploader({
  caseId,
  kind,
  label,
  done: initialDone,
  onUploaded,
}: {
  caseId: string;
  kind: KycDocKind;
  label: string;
  done: boolean;
  onUploaded: (kinds: KycDocKind[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(initialDone ? "done" : "idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(raw: File | undefined) {
    if (!raw) return;
    setError(null);
    if (raw.size > MAX_BYTES) {
      setStatus("error");
      setError("Arquivo acima de 12 MB.");
      return;
    }
    if (!ACCEPT.split(",").includes(raw.type)) {
      setStatus("error");
      setError("Formato inválido. Use JPG, PNG, WEBP ou PDF.");
      return;
    }

    setStatus("working");
    setFileName(raw.name);
    try {
      const file = await downscaleImage(raw);
      const fd = new FormData();
      fd.set("caseId", caseId);
      fd.set("kind", kind);
      fd.set("file", file);
      const res = await uploadKycDocAction(initialKycUploadState, fd);
      if (res.status === "success") {
        setStatus("done");
        onUploaded(res.kinds ?? []);
      } else {
        setStatus("error");
        setError(res.message ?? "Não foi possível enviar este arquivo.");
      }
    } catch {
      setStatus("error");
      setError("Não foi possível enviar este arquivo. Tente novamente.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-[#071D4A]">
        {label}
        <span className="ml-1 text-[#D92D20]">*</span>
      </p>

      {status === "done" ? (
        <div className="flex items-center gap-3 rounded-[12px] border border-[#C7ECD5] bg-[#F3FCF6] p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#ECF9F0] text-[#20B85A]">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#12622E]">Enviado</p>
            {fileName && (
              <p className="truncate text-[12px] text-[#5B6B88]">{fileName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-semibold text-[#0645D8] hover:bg-[#EDF4FF]"
          >
            <RefreshCw className="size-3.5" /> Trocar
          </button>
        </div>
      ) : status === "working" ? (
        <div className="flex items-center gap-3 rounded-[12px] border border-[#DFE7F2] bg-white p-3">
          <Loader2 className="size-5 shrink-0 animate-spin text-[#0645D8]" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#071D4A]">Enviando…</p>
            {fileName && (
              <p className="truncate text-[12px] text-[#5B6B88]">{fileName}</p>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-1 rounded-[12px] border-2 border-dashed px-4 py-6 text-center transition-colors",
            status === "error"
              ? "border-[#F3C0BA] bg-[#FFF5F4]"
              : dragOver
                ? "border-[#0645D8] bg-[#EDF4FF]"
                : "border-[#C6D2E4] bg-[#F7FAFD] hover:border-[#9FBCEC]",
          )}
        >
          {status === "error" ? (
            <FileText className="size-6 text-[#D92D20]" />
          ) : (
            <CloudUpload className="size-6 text-[#0645D8]" />
          )}
          <span className="mt-1 text-[13px] font-medium text-[#071D4A]">
            Clique para enviar ou arraste o arquivo
          </span>
          <span className="text-[12px] text-[#5B6B88]">
            JPG, PNG, WEBP ou PDF · até 12 MB
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        className="sr-only"
        aria-label={label}
      />
      {error && (
        <p className="mt-1.5 text-[12px] font-medium text-[#D92D20]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
