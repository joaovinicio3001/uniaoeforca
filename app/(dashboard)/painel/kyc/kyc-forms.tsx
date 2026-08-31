"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Lock, Send } from "lucide-react";

import { finalizeKycAction, startKycAction } from "./actions";
import { KYC_REQUIRED_KINDS, type KycDocKind } from "@/lib/kyc/shared";
import { DocumentUploader } from "./document-uploader";

const LABELS: Record<KycDocKind, string> = {
  id_front: "Documento — frente",
  id_back: "Documento — verso",
  selfie: "Selfie segurando o documento",
};

const TIPS = [
  { title: "Documento legível", text: "Sem cortes, reflexos ou fotos tremidas." },
  { title: "Boa iluminação", text: "Ambiente claro, sem sombra sobre o documento." },
  { title: "Selfie nítida", text: "Seu rosto e o documento juntos, bem visíveis." },
];

export function DocumentVerification() {
  const router = useRouter();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Set<KycDocKind>>(new Set());
  const [pending, start] = useTransition();

  useEffect(() => {
    let alive = true;
    startKycAction()
      .then((res) => {
        if (!alive) return;
        if (res.ok && res.caseId) {
          setCaseId(res.caseId);
        } else if (res.already) {
          router.refresh();
        } else {
          setLoadErr(res.message ?? "Não foi possível iniciar a verificação.");
        }
      })
      .catch(() => alive && setLoadErr("Não foi possível iniciar a verificação."));
    return () => {
      alive = false;
    };
  }, [router]);

  const allDone = KYC_REQUIRED_KINDS.every((k) => uploaded.has(k));

  function submit() {
    if (!caseId || !allDone) return;
    const fd = new FormData();
    fd.set("caseId", caseId);
    start(async () => {
      const res = await finalizeKycAction(fd);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  if (loadErr) {
    return (
      <div className="rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]">
        {loadErr}
      </div>
    );
  }

  if (!caseId) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#5B6B88]">
        <Loader2 className="size-4 animate-spin" /> Preparando…
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {KYC_REQUIRED_KINDS.map((kind) => (
            <DocumentUploader
              key={kind}
              caseId={caseId}
              kind={kind}
              label={LABELS[kind]}
              done={uploaded.has(kind)}
              onUploaded={(kinds) => setUploaded(new Set(kinds))}
            />
          ))}
        </div>

        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#DFE7F2] bg-[#F7FAFD] px-3.5 py-3 text-[13px] text-[#5B6B88]">
          <Lock className="mt-0.5 size-4 shrink-0 text-[#5B6B88]" />
          Seus documentos ficam em ambiente protegido, com acesso restrito à
          equipe de verificação.
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!allDone || pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-[#0645D8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B4FE5] disabled:cursor-not-allowed disabled:opacity-60 max-sm:w-full"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Send className="size-4" /> Enviar documentos
            </>
          )}
        </button>
        {!allDone && (
          <p className="text-[12px] text-[#5B6B88]">
            Envie os 3 arquivos (frente, verso e selfie) para concluir.
          </p>
        )}
      </div>

      <aside className="rounded-[14px] border border-[#C7ECD5] bg-[#ECF9F0] p-5">
        <p className="text-sm font-bold text-[#071D4A]">
          Dicas para um envio aceito
        </p>
        <ul className="mt-3 space-y-3">
          {TIPS.map((t) => (
            <li key={t.title} className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#20B85A]" />
              <div>
                <p className="text-[13px] font-semibold text-[#071D4A]">
                  {t.title}
                </p>
                <p className="text-[12px] leading-snug text-[#5B6B88]">
                  {t.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
