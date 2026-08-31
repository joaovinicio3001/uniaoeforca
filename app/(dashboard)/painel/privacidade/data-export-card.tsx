"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileDown, Info, Loader2, Lock, ShieldCheck } from "lucide-react";

import { CARD } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export function DataExportCard() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/me/export", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();

      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ??
        `uniao-e-forca-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Seus dados foram preparados com sucesso.");
    } catch {
      toast.error("Não foi possível preparar seus dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={cn(CARD, "p-5 sm:p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#EDF4FF] text-[#0645D8]">
            <FileDown className="size-7" />
          </span>
          <div>
            <h2 className="text-[18px] font-bold text-[#071D4A]">
              Baixar meus dados
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#5B6B88]">
              Exporte uma cópia dos dados associados à sua conta em um arquivo
              JSON.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[11px] border border-[#B9CDF2] bg-white px-4 text-sm font-semibold text-[#0645D8] transition-colors hover:bg-[#EDF4FF] disabled:cursor-not-allowed disabled:opacity-60 max-sm:w-full"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Preparando…
            </>
          ) : (
            <>
              <Download className="size-4" /> Baixar (JSON)
            </>
          )}
        </button>
      </div>

      <div className="mt-5 rounded-[12px] border border-[#DCE8FF] bg-[#F4F8FF] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#071D4A]">
          <Info className="size-4 text-[#0645D8]" /> O que está incluído?
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#5B6B88]">
          Dados do seu perfil e preferências, campanhas criadas, contribuições
          realizadas, histórico de saques e o status das suas verificações. Não
          incluímos senhas, tokens, arquivos de documentos ou dados de outras
          pessoas.
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Benefit
          icon={ShieldCheck}
          title="Seus dados são seus"
          text="Você pode guardar e consultar sua cópia quando precisar."
        />
        <Benefit
          icon={Lock}
          title="Gerado com segurança"
          text="O arquivo é montado no servidor apenas para a conta autenticada."
        />
      </div>
    </section>
  );
}

function Benefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-[#0645D8]" />
      <div>
        <p className="text-sm font-semibold text-[#071D4A]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[#5B6B88]">
          {text}
        </p>
      </div>
    </div>
  );
}
