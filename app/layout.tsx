import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESCRIPTION =
  "Plataforma brasileira de campanhas de arrecadação (vaquinha online). Crie sua causa, receba doações por PIX e acompanhe tudo com transparência.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "União & Força — Vaquinha online e doações por PIX",
    template: "%s · União & Força",
  },
  description: DESCRIPTION,
  applicationName: "União & Força",
  keywords: [
    "vaquinha online",
    "campanha de arrecadação",
    "doação por PIX",
    "financiamento coletivo",
    "crowdfunding Brasil",
    "arrecadar dinheiro",
    "vaquinha PIX",
  ],
  authors: [{ name: "União & Força" }],
  creator: "União & Força",
  publisher: "União & Força",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "União & Força",
    url: SITE_URL,
    title: "União & Força — Vaquinha online e doações por PIX",
    description: DESCRIPTION,
    images: [
      { url: "/logo-lockup.png", width: 1716, height: 829, alt: "União & Força" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "União & Força — Vaquinha online e doações por PIX",
    description: DESCRIPTION,
    images: ["/logo-lockup.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
