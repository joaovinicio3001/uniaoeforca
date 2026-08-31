/**
 * Injeta um bloco JSON-LD (dados estruturados schema.org) para o Google.
 * Server component — renderiza um <script> no HTML inicial.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify já escapa aspas; </script> é neutralizado abaixo.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
