"use client";

import { useMemo } from "react";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import { formatKrw, formatPercent } from "@/lib/format";
import type { Holding } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

export type Basis = "market" | "cost";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

export function AllocationList({
  holdings,
  basis,
}: {
  holdings: Holding[];
  basis: Basis;
}) {
  const { palette } = useChartTokens();
  const items = useMemo(() => {
    const list = holdings.map((h) => ({
      ...h,
      basisValue: basis === "market" ? h.marketValueKrw : h.investedKrw,
    }));
    const total = list.reduce((acc, h) => acc + h.basisValue, 0);
    return list
      .map((h) => ({
        ...h,
        basisWeight: total > 0 ? (h.basisValue / total) * 100 : 0,
      }))
      .sort((a, b) => b.basisValue - a.basisValue);
  }, [holdings, basis]);

  return (
    <ol className="space-y-3">
      {items.map((h, idx) => {
        const color = palette[idx % palette.length];
        return (
          <li key={`${h.market}:${h.symbol}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate font-medium">{h.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{h.symbol}</span>
              </div>
              <div className="text-right">
                <div className="tabular font-medium">{formatKrw(h.basisValue)}</div>
                <div className={cn("text-xs tabular", pnlClass(h.unrealizedPnlRate))}>
                  {formatPercent(h.unrealizedPnlRate, { signed: true })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${h.basisWeight}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs tabular text-muted-foreground">
                {h.basisWeight.toFixed(1)}%
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
