import Link from "next/link";
import { LogOut } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/actions";
import { highestRole } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/session";

export function AppTopbar({
  user,
  area,
}: {
  user: SessionUser;
  area: "painel" | "admin";
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <Link href={area === "admin" ? "/admin" : "/painel"}>
          <Logo />
        </Link>
        <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {area === "admin" ? "Administração" : "Painel"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">
            {user.displayName ?? user.fullName ?? user.email}
          </p>
          <p className="text-xs capitalize text-muted-foreground">
            {highestRole(user.roles)}
          </p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" /> Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
