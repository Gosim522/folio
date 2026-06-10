"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS, type PnlDirection } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const OPTIONS: { value: PnlDirection; label: string }[] = [
  { value: "western", label: "글로벌" },
  { value: "eastern", label: "한국" },
];

export function PnlDirectionToggle() {
  const [direction, setDirection] = usePreference<PnlDirection>(
    PREF_KEYS.pnlDirection,
    PREF_DEFAULTS.pnlDirection,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        손익 색상
      </div>
      <div
        role="radiogroup"
        aria-label="손익 색상 방향"
        className="grid grid-cols-2 gap-0.5 rounded-xl bg-muted p-1"
      >
        {OPTIONS.map((opt) => {
          const active = direction === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setDirection(opt.value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="inline-flex items-center gap-0.5">
                <ArrowUp className="size-3 text-pos" strokeWidth={2.4} />
                <ArrowDown className="size-3 text-neg" strokeWidth={2.4} />
              </span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
