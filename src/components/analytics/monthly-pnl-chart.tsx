"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import { useMounted } from "@/hooks/use-mounted";
import type { MonthlyPnlPoint } from "@/lib/analytics/service";
import { formatSignedKrw } from "@/lib/format";

const monthFmt = new Intl.DateTimeFormat("ko-KR", { year: "2-digit", month: "numeric" });

function formatShortKrw(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000_000) return `${sign}${(abs / 10_000_000).toFixed(1)}천만`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000)}만`;
  return `${sign}${Math.round(abs).toLocaleString("ko-KR")}`;
}

type TooltipItem = {
  value?: number | string;
  payload?: { month?: string };
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
  const v = Number(payload[0].value ?? 0);
  const month = String(payload[0].payload?.month ?? "");
  const date = new Date(`${month}-01`);
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-soft"
      style={{ background: surface, border: `1px solid ${grid}`, color: text }}
    >
      <div style={{ opacity: 0.65 }}>{monthFmt.format(date)}</div>
      <div className="tabular text-sm font-semibold">{formatSignedKrw(v)}</div>
    </div>
  );
}

export function MonthlyPnlChart({ data }: { data: MonthlyPnlPoint[] }) {
  const tokens = useChartTokens();
  const mounted = useMounted();
  if (!mounted) return <div style={{ height: 240 }} />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={tokens.grid} strokeDasharray="3 4" vertical={false} />
        <ReferenceLine y={0} stroke={tokens.grid} />
        <XAxis
          dataKey="month"
          tickFormatter={(m: string) => monthFmt.format(new Date(`${m}-01`))}
          axisLine={false}
          tickLine={false}
          stroke={tokens.axis}
          tick={{ fontSize: 11, fill: tokens.axis }}
        />
        <YAxis
          tickFormatter={(v: number) => formatShortKrw(v)}
          axisLine={false}
          tickLine={false}
          stroke={tokens.axis}
          tick={{ fontSize: 11, fill: tokens.axis }}
          width={56}
        />
        <Tooltip
          cursor={{ fill: tokens.grid, fillOpacity: 0.3 }}
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
        <Bar dataKey="realizedPnlKrw" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((d, idx) => (
            <Cell
              key={idx}
              fill={d.realizedPnlKrw >= 0 ? tokens.pos : tokens.neg}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
