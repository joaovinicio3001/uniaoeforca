export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      {updated && (
        <p className="mt-1 text-sm text-muted-foreground">
          Última atualização: {updated}
        </p>
      )}
      <div className="rich-text mt-8">{children}</div>
    </div>
  );
}
