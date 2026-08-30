import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CategoryRow } from "@/lib/campaigns/queries";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

/**
 * Filtro de campanhas. Formulário GET puro (sem JS) — envia para /campanhas.
 * Usado na home e no topo da listagem.
 */
export function CampaignSearchBar({
  categories,
  defaults,
  className,
}: {
  categories: CategoryRow[];
  defaults?: { q?: string; categoria?: string; estado?: string };
  className?: string;
}) {
  return (
    <form
      action="/campanhas"
      className={
        "grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end " +
        (className ?? "")
      }
    >
      <label className="block text-left">
        <span className="mb-1.5 block text-sm font-medium">Buscar campanhas</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={defaults?.q ?? ""}
            placeholder="O que você está procurando?"
            className="h-11 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </label>

      <label className="block text-left">
        <span className="mb-1.5 block text-sm font-medium">Categoria</span>
        <select
          name="categoria"
          defaultValue={defaults?.categoria ?? ""}
          className="h-11 w-full min-w-[10rem] rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-left">
        <span className="mb-1.5 block text-sm font-medium">Localização</span>
        <select
          name="estado"
          defaultValue={defaults?.estado ?? ""}
          className="h-11 w-full min-w-[8rem] rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todo o Brasil</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" size="lg" className="h-11 sm:col-span-2 lg:col-span-1">
        <Search className="size-4" /> Buscar
      </Button>
    </form>
  );
}
