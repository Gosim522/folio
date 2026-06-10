"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import {
  SECTOR_PERIOD_LABEL,
  type SectorPeriod,
  type SectorReturn,
} from "@/lib/quotes/sectors";
import { cn } from "@/lib/utils";

const PERIODS: SectorPeriod[] = ["d1", "w1", "m1", "m3", "y1"];

function fmtPct(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function SectorPerformance({ sectors }: { sectors: SectorReturn[] }) {
  const tokens = useChartTokens();
  const mounted = useMounted();
  const [period, setPeriod] = useState<SectorPeriod>("d1");

  const data = [...sectors]
    .map((s) => ({
      sector: s.name,
      change: Number(s[period].toFixed(2)),
    }))
    .sort((a, b) => b.change - a.change);

  // Domain shows |max| + 1% on each side, e.g., max 1.66% → axis spans ±3%.
  const absMax = Math.max(...data.map((d) => Math.abs(d.change)), 0);
  const domainMax = Math.max(Math.ceil(absMax) + 1, 2);

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
        섹터 데이터를 불러오지 못했어요
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex w-fit items-center gap-0.5 rounded-md bg-muted/60 p-0.5 text-xs">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              period === p
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={period === p}
          >
            {SECTOR_PERIOD_LABEL[p]}
          </button>
        ))}
      </div>
      <div className="h-72 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
            >
              <CartesianGrid stroke={tokens.grid} horizontal={false} />
              <XAxis
                type="number"
                domain={[-domainMax, domainMax]}
                stroke={tokens.axis}
                tick={{ fill: tokens.text, fontSize: 11 }}
                tickFormatter={(v) => `${Math.round(Number(v))}%`}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="sector"
                stroke={tokens.axis}
                tick={{ fill: tokens.text, fontSize: 12 }}
                width={88}
              />
              <Bar dataKey="change" radius={[0, 6, 6, 0]}>
                {data.map((d) => (
                  <Cell
                    key={d.sector}
                    fill={d.change >= 0 ? tokens.pos : tokens.neg}
                  />
                ))}
                <LabelList
                  dataKey="change"
                  position="right"
                  formatter={(v) => fmtPct(Number(v ?? 0))}
                  fill={tokens.text}
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}
