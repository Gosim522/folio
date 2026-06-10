"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "라이트", Icon: Sun },
  { value: "system", label: "시스템", Icon: Monitor },
  { value: "dark", label: "다크", Icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = mounted ? (theme ?? "system") : "system";

  return (
    <div
      role="radiogroup"
      aria-label="테마"
      className="grid grid-cols-3 gap-0.5 rounded-xl bg-muted p-1"
    >
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
