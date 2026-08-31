import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { getSessionUser } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Quem já está logado não precisa ver login/cadastro.
  const user = await getSessionUser();
  if (user) redirect("/painel");

  return <AuthShell>{children}</AuthShell>;
}
