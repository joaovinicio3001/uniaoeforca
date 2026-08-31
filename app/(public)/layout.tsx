import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { publicEnv } from "@/lib/env";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "União & Força",
          url: base,
          logo: `${base}/logo-lockup.png`,
          description:
            "Plataforma brasileira de campanhas de arrecadação (vaquinha online) com doações por PIX.",
          areaServed: "BR",
          sameAs: [],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "União & Força",
          url: base,
          inLanguage: "pt-BR",
          potentialAction: {
            "@type": "SearchAction",
            target: `${base}/campanhas?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
