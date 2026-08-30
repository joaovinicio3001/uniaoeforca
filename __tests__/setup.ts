// Env mínimo para módulos que validam process.env no import (lib/env.ts).
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key-000000000000";
process.env.CPF_HASH_PEPPER ??= "test-pepper-0123456789abcdef";
process.env.SECRETS_ENC_KEY ??=
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
