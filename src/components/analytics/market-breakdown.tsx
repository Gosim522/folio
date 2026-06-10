import type { MarketBreakdown } from "@/lib/analytics/service";
import { formatKrw } from "@/lib/format";

const COLORS: Record<MarketBreakdown["market"], string> = {
  KR: "var(--chart-1)",
  US: "var(--chart-3)",
};

export function MarketBreakdownView({ data }: { data: MarketBreakdown[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">보유 종목 없음</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {data.map((d) => (
          <div
            key={d.market}
            style={{ width: `${d.weight}%`, background: COLORS[d.market] }}
            title={`${d.label} ${d.weight.toFixed(1)}%`}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.market} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ background: COLORS[d.market] }}
              />
              <span className="font-medium">{d.label}</span>
              <span className="text-xs text-muted-foreground">{d.count}종목</span>
            </div>
            <div className="text-right">
              <div className="tabular text-sm font-semibold">{formatKrw(d.marketValueKrw)}</div>
              <div className="tabular text-xs text-muted-foreground">
                {d.weight.toFixed(1)}%
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
