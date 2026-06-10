"use client";

import { RefreshCw } from "lucide-react";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: 30, label: "30초" },
  { value: 60, label: "1분" },
  { value: 300, label: "5분" },
  { value: 0, label: "수동" },
] as const;

export function RefreshIntervalToggle() {
  const [refreshSec, setRefreshSec] = usePreference<number>(
    PREF_KEYS.refreshInterval,
    PREF_DEFAULTS.refreshInterval,
  );

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <RefreshCw className="size-4 text-muted-foreground" strokeWidth={1.8} />
        <span className="font-medium">갱신 주기</span>
      </div>
      <div
        role="radiogroup"
        aria-label="자동 갱신 주기"
        className="inline-flex rounded-xl bg-muted p-1"
      >
        {OPTIONS.map((o) => {
          const active = refreshSec === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRefreshSec(o.value)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
