import type { StripIndex } from "@/lib/quotes/indices";
import { cn } from "@/lib/utils";
import { MiniSparkline } from "./mini-sparkline";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

function formatPrice(value: number) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: value < 1000 ? 2 : value < 100000 ? 2 : 0,
  });
}

function formatChange(value: number) {
  const abs = Math.abs(value);
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${abs.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`;
}

function formatRate(value: number) {
  const abs = Math.abs(value);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${abs.toFixed(2)}%`;
}

export function MarketStrip({ items }: { items: StripIndex[] }) {
  if (items.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card px-4 py-3 [scrollbar-width:thin]">
      <div className="flex items-center gap-8">
        {items.map((item) => {
          const tone = item.changeAbs >= 0 ? "pos" : "neg";
          return (
            <div key={item.key} className="flex shrink-0 items-center gap-3">
              <MiniSparkline data={item.series} tone={tone} />
              <div className="leading-tight">
                <div className="text-[11px] text-muted-foreground">{item.name}</div>
                <div className="flex items-baseline gap-2">
                  <span className="tabular text-sm font-semibold">
                    {formatPrice(item.price)}
                  </span>
                  <span className={cn("text-xs tabular", pnlClass(item.changeAbs))}>
                    {formatChange(item.changeAbs)} ({formatRate(item.changeRate)})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
