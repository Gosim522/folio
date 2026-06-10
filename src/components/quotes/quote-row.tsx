import type { Quote } from "@/lib/quotes/types";
import { formatKrw, formatPercent, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

function formatPrice(q: Quote) {
  return q.market === "KR" ? formatKrw(q.price) : formatUsd(q.price);
}

export function QuoteRow({ quote }: { quote: Quote }) {
  const tone = pnlClass(quote.changeAbs);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium leading-tight">{quote.name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{quote.symbol}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="tabular text-sm font-medium leading-tight">{formatPrice(quote)}</div>
        <div className={cn("mt-0.5 text-xs tabular", tone)}>
          {formatPercent(quote.changeRate, { signed: true })}
        </div>
      </div>
    </div>
  );
}
