"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import { useMounted } from "@/hooks/use-mounted";
import { formatKrw } from "@/lib/format";
import type { EnrichedTrade } from "@/lib/portfolio/types";

export function BuySellRatio({ trades }: { trades: EnrichedTrade[] }) {
  const tokens = useChartTokens();
  const mounted = useMounted();

  const { buyValue, sellValue, buyCount, sellCount } = useMemo(() => {
    let buy = 0;
    let sell = 0;
    let bc = 0;
    let sc = 0;
    for (const t of trades) {
      const krw = t.price * t.exchangeRate * t.quantity;
      if (t.side === "BUY") {
        buy += krw;
        bc += 1;
      } else {
        sell += krw;
        sc += 1;
      }
    }
    return { buyValue: buy, sellValue: sell, buyCount: bc, sellCount: sc };
  }, [trades]);

  const total = buyValue + sellValue;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
        거래가 없어요
      </div>
    );
  }

  const data = [
    { name: "매수", value: buyValue, color: tokens.pos },
    { name: "매도", value: sellValue, color: tokens.neg },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative h-44 w-44 shrink-0">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : null}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[11px] text-muted-foreground">총 거래</div>
          <div className="tabular text-xl font-semibold">{trades.length}회</div>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        <Row
          tone="pos"
          label="매수"
          countText={`${buyCount}회`}
          valueText={formatKrw(buyValue)}
          pct={(buyValue / total) * 100}
          color={tokens.pos}
        />
        <Row
          tone="neg"
          label="매도"
          countText={`${sellCount}회`}
          valueText={formatKrw(sellValue)}
          pct={(sellValue / total) * 100}
          color={tokens.neg}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  countText,
  valueText,
  pct,
  color,
}: {
  tone: "pos" | "neg";
  label: string;
  countText: string;
  valueText: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{countText}</span>
        </div>
        <span className="tabular text-sm font-semibold">{valueText}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-right text-[11px] tabular text-muted-foreground">
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}
