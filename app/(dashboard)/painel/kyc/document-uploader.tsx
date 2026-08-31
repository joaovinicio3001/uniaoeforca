"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileText, X } from "lucide-react";

import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploader({
  name,
  label,
  optional = false,
}: {
  name: string;
  label: string;
  optional?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function apply(f: File | null) {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Arquivo acima de 10 MB.");
      return;
    }
    if (!ACCEPT.split(",").includes(f.type)) {
      setError("Formato inválido. Use JPG, PNG, WEBP ou PDF.");
      return;
    }
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  function clear() {
    apply(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-[#071D4A]">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-[#5B6B88]">(opcional)</span>
        )}
      </p>

      {file ? (
        <div className="flex items-center gap-3 rounded-[12px] border border-[#DFE7F2] bg-white p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="size-12 shrink-0 rounded-[8px] object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[8px] bg-[#EDF4FF] text-[#0645D8]">
              <FileText className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#071D4A]">
              {file.name}
            </p>
            <p className="text-[12px] text-[#5B6B88]">
              {fmtSize(file.size)} · pronto para envio
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md px-2 py-1 text-[13px] font-semibold text-[#0645D8] hover:bg-[#EDF4FF]"
          >
            Trocar
          </button>
          <button
            type="button"
            onClick={clear}
            aria-label="Remover arquivo"
            className="flex size-8 items-center justify-center rounded-md text-[#D92D20] hover:bg-[#FEECEA]"
          >
            <X className="size-4" />
          </button>
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
            apply(e.dataTransfer.files[0] ?? null);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-1 rounded-[12px] border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragOver
              ? "border-[#0645D8] bg-[#EDF4FF]"
              : "border-[#C6D2E4] bg-[#F7FAFD] hover:border-[#9FBCEC]",
          )}
        >
          <CloudUpload className="size-6 text-[#0645D8]" />
          <span className="mt-1 text-[13px] font-medium text-[#071D4A]">
            Clique para enviar ou arraste seu arquivo aqui
          </span>
          <span className="text-[12px] text-[#5B6B88]">
            JPG, PNG, WEBP ou PDF · até 10 MB
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={ACCEPT}
        onChange={(e) => apply(e.target.files?.[0] ?? null)}
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
