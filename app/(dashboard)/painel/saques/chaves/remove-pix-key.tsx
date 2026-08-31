"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { disablePixKeyAction } from "../actions";

export function RemovePixKey({ keyId }: { keyId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        role="alertdialog"
        aria-label="Confirmar remoção da chave PIX"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#071D4A]/40 p-4"
      >
        <div className="w-full max-w-sm rounded-[16px] border border-[#DFE7F2] bg-white p-6 shadow-[0_20px_50px_rgba(7,29,74,0.25)]">
          <h3 className="text-[17px] font-bold text-[#071D4A]">
            Remover esta chave PIX?
          </h3>
          <p className="mt-2 text-sm text-[#5B6B88]">
            Ela deixará de aparecer para novos saques. Você pode cadastrar outra
            depois.
          </p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#DFE7F2] bg-white px-4 text-sm font-semibold text-[#17315C] hover:bg-[#F5F8FE]"
            >
              Cancelar
            </button>
            <form action={disablePixKeyAction}>
              <input type="hidden" name="keyId" value={keyId} />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#D92D20] px-4 text-sm font-semibold text-white hover:bg-[#BE2318] sm:w-auto"
              >
                Remover chave
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Remover chave PIX"
      className="flex size-9 items-center justify-center rounded-[9px] text-[#D92D20] transition-colors hover:bg-[#FEECEA]"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
