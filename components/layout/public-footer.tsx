import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function PublicFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Juntos fazemos a diferença.
          </p>
        </div>
        <FooterCol
          title="Plataforma"
          links={[
            ["Campanhas", "/campanhas"],
            ["Como funciona", "/como-funciona"],
            ["Taxas", "/taxas"],
          ]}
        />
        <FooterCol
          title="Confiança"
          links={[
            ["Segurança", "/seguranca"],
            ["Central de ajuda", "/ajuda"],
            ["Regras de campanhas", "/politica-campanhas"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["Termos de Uso", "/termos"],
            ["Política de Privacidade", "/privacidade"],
          ]}
        />
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} União &amp; Força. Todos os direitos reservados.</p>
          <p>uniaoeforca.com.br</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
