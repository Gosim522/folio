import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatKrw, formatPercent, formatSignedKrw, formatUsd } from "@/lib/format";
import type { Holding } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

function formatLocal(h: Holding, v: number) {
  return h.market === "KR" ? formatKrw(v) : formatUsd(v);
}

export function HoldingsPreview({ holdings, limit = 6 }: { holdings: Holding[]; limit?: number }) {
  const top = holdings.slice(0, limit);
  return (
    <div>
      <div className="divide-y divide-border">
        {top.map((h) => (
          <div
            key={`${h.market}:${h.symbol}`}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {h.market}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium leading-tight">{h.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {h.quantity}주 · 평균 {formatLocal(h, h.avgPrice)}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="tabular text-sm font-medium leading-tight">
                {formatKrw(h.marketValueKrw)}
              </div>
              <div className={cn("mt-0.5 text-xs tabular", pnlClass(h.unrealizedPnlKrw))}>
                {formatSignedKrw(h.unrealizedPnlKrw)} ({formatPercent(h.unrealizedPnlRate, { signed: true })})
              </div>
            </div>
          </div>
        ))}
      </div>
      {holdings.length > limit ? (
        <Link
          href="/portfolio"
          className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          전체 {holdings.length}개 보기
          <ArrowRight className="size-3" strokeWidth={2} />
        </Link>
      ) : null}
    </div>
  );
}
