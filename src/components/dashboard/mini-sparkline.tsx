"use client";

import { useId } from "react";
import { Area, AreaChart } from "recharts";
import { useChartTokens } from "@/hooks/use-chart-tokens";

type Props = {
  data: number[];
  tone: "pos" | "neg";
  width?: number;
  height?: number;
};

export function MiniSparkline({ data, tone, width = 72, height = 36 }: Props) {
  const tokens = useChartTokens();
  const id = useId();
  const color = tone === "pos" ? tokens.pos : tokens.neg;
  const points = data.length > 0 ? data.map((v, i) => ({ i, v })) : [{ i: 0, v: 0 }];
  return (
    <div className="shrink-0" style={{ width, height }}>
      <AreaChart
        width={width}
        height={height}
        data={points}
        margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${id})`}
          isAnimationActive={false}
          dot={false}
          activeDot={false}
        />
      </AreaChart>
    </div>
  );
}
