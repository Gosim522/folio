"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import { useMounted } from "@/hooks/use-mounted";
import type { ActivityPoint } from "@/lib/analytics/service";

const monthFmt = new Intl.DateTimeFormat("ko-KR", { year: "2-digit", month: "numeric" });

type TooltipItem = {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
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
  const month = String(payload[0]?.payload?.month ?? "");
  const date = new Date(`${month}-01`);
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-soft"
      style={{ background: surface, border: `1px solid ${grid}`, color: text }}
    >
      <div style={{ opacity: 0.65 }}>{monthFmt.format(date)}</div>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={p.dataKey as string} className="flex items-center gap-2">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: p.color }}
            />
            <span style={{ opacity: 0.65 }}>
              {p.dataKey === "buys" ? "매수" : "매도"}
            </span>
            <span className="tabular font-semibold">{p.value}건</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const tokens = useChartTokens();
  const mounted = useMounted();
  if (!mounted) return <div style={{ height: 240 }} />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={tokens.grid} strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={(m: string) => monthFmt.format(new Date(`${m}-01`))}
          axisLine={false}
          tickLine={false}
          stroke={tokens.axis}
          tick={{ fontSize: 11, fill: tokens.axis }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          stroke={tokens.axis}
          tick={{ fontSize: 11, fill: tokens.axis }}
          width={28}
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
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => (value === "buys" ? "매수" : "매도")}
        />
        <Bar dataKey="buys" fill={tokens.pos} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="sells" fill={tokens.neg} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
