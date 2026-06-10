"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import { useMounted } from "@/hooks/use-mounted";
import { usePreference } from "@/hooks/use-preferences";
import { formatKrw } from "@/lib/format";
import { generateEquityCurve } from "@/lib/portfolio/equity-curve";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "1W", label: "1주", days: 7 },
  { key: "1M", label: "1개월", days: 30 },
  { key: "3M", label: "3개월", days: 90 },
  { key: "6M", label: "6개월", days: 180 },
  { key: "1Y", label: "1년", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];
const DEFAULT_RANGE: RangeKey = "3M";

function formatShortKrw(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}천만`;
  if (abs >= 10_000) return `${Math.round(value / 10_000)}만`;
  return Math.round(value).toLocaleString("ko-KR");
}

const xFmtShort = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" });
const xFmtLong = new Intl.DateTimeFormat("ko-KR", { year: "2-digit", month: "numeric" });
const tipFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

type TooltipItem = {
  value?: number | string;
  payload?: { date?: string };
};

function ChartTooltip({
  active,
  payload,
  surface,
  grid,
  text,
}: {
  active?: boolean;
  payload?: readonly TooltipItem[];
  surface: string;
  grid: string;
  text: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const value = typeof point.value === "number" ? point.value : 0;
  const date = new Date(String(point.payload?.date));
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-soft"
      style={{ background: surface, border: `1px solid ${grid}`, color: text }}
    >
      <div style={{ opacity: 0.65 }}>{tipFmt.format(date)}</div>
      <div className="tabular text-sm font-semibold">{formatKrw(value)}</div>
    </div>
  );
}

export function EquityChart({ endValue }: { endValue: number }) {
  const [range, setRange] = usePreference<RangeKey>("dashboard.equityRange", DEFAULT_RANGE);
  const mounted = useMounted();

  const cfg = RANGES.find((r) => r.key === range) ?? RANGES[2];
  const data = useMemo(() => generateEquityCurve(endValue, cfg.days), [endValue, cfg.days]);
  const tokens = useChartTokens();
  const gradientId = useId();

  const interval = Math.max(1, Math.floor(data.length / 6));
  const useLongDate = cfg.days >= 180;
  const min = data.reduce((acc, p) => Math.min(acc, p.value), Infinity);
  const max = data.reduce((acc, p) => Math.max(acc, p.value), -Infinity);
  const pad = (max - min) * 0.08 || Math.max(1, max * 0.02);
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const periodPct = first > 0 ? ((last - first) / first) * 100 : 0;
  const periodTone = periodPct > 0 ? "text-pos" : periodPct < 0 ? "text-neg" : "text-muted-foreground";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">기간 수익률</span>
          <span className={cn("tabular text-sm font-semibold", periodTone)}>
            {periodPct > 0 ? "+" : ""}
            {periodPct.toFixed(2)}%
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="기간 선택"
          className="inline-flex rounded-xl bg-muted p-1"
        >
          {RANGES.map((r) => {
            const active = mounted ? range === r.key : r.key === DEFAULT_RANGE;
            return (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRange(r.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {mounted ? (
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tokens.brand} stopOpacity={0.28} />
              <stop offset="95%" stopColor={tokens.brand} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={tokens.grid} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) =>
              (useLongDate ? xFmtLong : xFmtShort).format(new Date(value))
            }
            interval={interval}
            axisLine={false}
            tickLine={false}
            stroke={tokens.axis}
            tick={{ fontSize: 11, fill: tokens.axis }}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tickFormatter={(v: number) => formatShortKrw(v)}
            axisLine={false}
            tickLine={false}
            stroke={tokens.axis}
            tick={{ fontSize: 11, fill: tokens.axis }}
            width={56}
          />
          <Tooltip
            cursor={{ stroke: tokens.axis, strokeDasharray: "3 3", strokeOpacity: 0.5 }}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload as unknown as readonly TooltipItem[]}
                surface={tokens.surface}
                grid={tokens.grid}
                text={tokens.text}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={tokens.brand}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      ) : (
        <div style={{ height: 256 }} />
      )}
    </div>
  );
}
