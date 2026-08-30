/** @type {import('next').NextConfig} */

const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");

// CSP pragmática: Next injeta scripts/estilos inline na hidratação; nonce exigiria
// middleware por request. `frame-ancestors 'none'` + `form-action 'self'` mitigam
// clickjacking e exfiltração de formulário.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: https://${supabaseHost} https://*.b-cdn.net https://*.woovi.com`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.pushinpay.com.br https://ggpixapi.com`,
  "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.b-cdn.net" },
      { protocol: "https", hostname: supabaseHost || "qmpsranxguyxxbplvcjf.supabase.co" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
