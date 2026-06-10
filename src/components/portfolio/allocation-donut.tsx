"use client";

import { useMemo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import { useMounted } from "@/hooks/use-mounted";
import { formatKrw } from "@/lib/format";
import type { Holding } from "@/lib/portfolio/types";

export type Basis = "market" | "cost";

type SliceDatum = {
  name: string;
  symbol: string;
  market: Holding["market"];
  value: number;
  weight: number;
  color: string;
};

function ChartTooltip({
  active,
  payload,
  surface,
  grid,
  text,
}: {
  active?: boolean;
  payload?: readonly { payload?: SliceDatum }[];
  surface: string;
  grid: string;
  text: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-soft"
      style={{ background: surface, border: `1px solid ${grid}`, color: text }}
    >
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: d.color }} />
        <span className="font-medium">{d.name}</span>
        <span style={{ opacity: 0.6 }}>{d.symbol}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2 tabular">
        <span className="text-sm font-semibold">{formatKrw(d.value)}</span>
        <span className="text-xs text-muted-foreground">{d.weight.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function AllocationDonut({
  holdings,
  basis,
}: {
  holdings: Holding[];
  basis: Basis;
}) {
  const tokens = useChartTokens();
  const mounted = useMounted();

  const { slices, total } = useMemo(() => {
    const valued = holdings.map((h) => ({
      ...h,
      basisValue: basis === "market" ? h.marketValueKrw : h.investedKrw,
    }));
    const sum = valued.reduce((acc, h) => acc + h.basisValue, 0);
    const sorted = [...valued].sort((a, b) => b.basisValue - a.basisValue);
    const data: SliceDatum[] = sorted.map((h, idx) => ({
      name: h.name,
      symbol: h.symbol,
      market: h.market,
      value: h.basisValue,
      weight: sum > 0 ? (h.basisValue / sum) * 100 : 0,
      color: tokens.palette[idx % tokens.palette.length],
    }));
    return { slices: data, total: sum };
  }, [holdings, basis, tokens.palette]);

  return (
    <div className="space-y-5">
      <div className="relative">
        {mounted ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={108}
              paddingAngle={1.5}
              dataKey="value"
              nameKey="name"
              stroke={tokens.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s, idx) => (
                <Cell key={idx} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={
                    props.payload as unknown as readonly {
                      payload?: SliceDatum;
                    }[]
                  }
                  surface={tokens.surface}
                  grid={tokens.grid}
                  text={tokens.text}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        ) : (
          <div style={{ height: 280 }} />
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {basis === "market" ? "평가금액" : "투자원금"}
          </div>
          <div className="tabular text-xl font-semibold leading-tight">{formatKrw(total)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{slices.length}종목</div>
        </div>
      </div>

      <ol className="space-y-2 text-sm">
        {slices.map((s, idx) => (
          <li key={`${s.market}:${s.symbol}`} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="w-4 shrink-0 text-right text-xs tabular text-muted-foreground">
                {idx + 1}
              </span>
              <span
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="truncate font-medium">{s.name}</span>
            </div>
            <span className="tabular text-xs text-muted-foreground">{s.weight.toFixed(1)}%</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
