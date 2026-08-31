import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "União & Força — Vaquinha online e doações por PIX",
    short_name: "União & Força",
    description:
      "Crie campanhas de arrecadação e receba doações por PIX com transparência.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7FAFE",
    theme_color: "#0645D8",
    lang: "pt-BR",
    icons: [
      { src: "/logo-mark.png", sizes: "512x512", type: "image/png" },
      {
        src: "/logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
