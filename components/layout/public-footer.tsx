import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function PublicFooter() {
  return (
    <footer className="bg-[#063B63] text-white">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo variant="light" />
          <p className="text-sm text-white/70">Juntos fazemos a diferença.</p>
        </div>
        <FooterCol
          title="Plataforma"
          links={[
            ["Campanhas", "/campanhas"],
            ["Como criar uma campanha", "/como-funciona"],
            ["Como doar", "/como-doar"],
          ]}
        />
        <FooterCol
          title="Confiança"
          links={[
            ["Regras e segurança", "/regras-e-seguranca"],
            ["Central de ajuda", "/ajuda"],
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
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/60 sm:flex-row">
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
      <ul className="space-y-2 text-sm text-white/70">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
