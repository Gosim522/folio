"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BROKERS } from "@/lib/brokers";
import { cn } from "@/lib/utils";

const OPTIONS: { id: string; label: string; href: string }[] = [
  { id: "all", label: "전체", href: "/" },
  ...BROKERS.map((b) => ({
    id: b.id,
    label: b.shortLabel,
    href: `/?account=${b.id}`,
  })),
];

/**
 * Global account view switcher (전체 / 토스 / 한국투자). Drives `?account=` —
 * the page reads it server-side and re-derives the portfolio, so every widget
 * reflects the selected account at once.
 */
export function AccountSelector() {
  const params = useSearchParams();
  const current = params.get("account") ?? "all";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {OPTIONS.map((o) => {
        const active = current === o.id;
        return (
          <Link
            key={o.id}
            href={o.href}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
