"use client";

import { passwordStrength } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const { score, label } = passwordStrength(value);
  const colors = [
    "bg-destructive",
    "bg-destructive",
    "bg-accent",
    "bg-success/70",
    "bg-success",
  ];
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < score ? colors[score] : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Força da senha: <span className="font-medium">{label}</span>
      </p>
    </div>
  );
}
