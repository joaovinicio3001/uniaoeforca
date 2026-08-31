"use client";

import { useActionState } from "react";

import { createTicketAction, type SupportFormState } from "../actions";
import { TICKET_CATEGORIES } from "@/lib/support/shared";
import { SubmitButton } from "@/components/forms/submit-button";

const initial: SupportFormState = { status: "idle" };

const field =
  "w-full rounded-[11px] border border-[#DFE7F2] bg-white px-3.5 py-2.5 text-[15px] text-[#071D4A] outline-none focus:border-[#0645D8] focus:shadow-[0_0_0_3px_rgba(6,69,216,0.10)]";
const label = "mb-1.5 block text-sm font-semibold text-[#071D4A]";

export function TicketForm({ categories }: { categories: typeof TICKET_CATEGORIES }) {
  const [state, action] = useActionState(createTicketAction, initial);

  return (
    <form action={action} className="space-y-4">
      {state.status === "error" && state.message && (
        <div className="rounded-[12px] border border-[#FFCFC9] bg-[#FFF1F0] px-3.5 py-3 text-sm text-[#8A1B12]">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="subject" className={label}>
          Assunto
        </label>
        <input id="subject" name="subject" required className={field} />
      </div>

      <div>
        <label htmlFor="category" className={label}>
          Categoria
        </label>
        <select id="category" name="category" className={field} defaultValue="duvida">
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="body" className={label}>
          Descreva o que está acontecendo
        </label>
        <textarea id="body" name="body" required rows={6} className={field} />
      </div>

      <SubmitButton
        className="h-12 w-full rounded-[11px] bg-[#0645D8] text-[15px] font-semibold hover:bg-[#0B4FE5]"
        pendingText="Abrindo…"
      >
        Abrir chamado
      </SubmitButton>
    </form>
  );
}
