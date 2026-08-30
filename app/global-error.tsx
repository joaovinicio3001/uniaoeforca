"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reporte best-effort ao endpoint interno de log.
    fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : "",
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F8FA",
          color: "#042f50",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Algo deu errado</h1>
          <p style={{ marginTop: 8, color: "#5b6b82" }}>
            Registramos o problema. Tente novamente em instantes.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              background: "#042f50",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
