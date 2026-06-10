import { EquityChart } from "@/components/dashboard/equity-chart";
import { HoldingsPreview } from "@/components/dashboard/holdings-preview";
import { MarketStrip } from "@/components/dashboard/market-strip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKrw, formatPercent, formatSignedKrw } from "@/lib/format";
import type { HeatmapSector } from "@/lib/quotes/heatmap";
import type { StripIndex } from "@/lib/quotes/indices";
import type { PortfolioResult } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";
import { Section } from "./section";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

type Props = {
  portfolio: PortfolioResult;
  strip: StripIndex[];
  /** Kept for revert path to the d3-hierarchy custom heatmap once it lived here. */
  heatmap?: HeatmapSector[];
};

export function DashboardSection({ portfolio, strip }: Props) {
  const { holdings, summary } = portfolio;
  const topMovers = [...holdings]
    .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate))
    .slice(0, 6);

  return (
    <Section id="dashboard">
      <div className="space-y-6">
        <MarketStrip items={strip} />

        <Card className="overflow-hidden">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">내 자산</div>
              <div className="tabular text-4xl font-semibold tracking-tight md:text-5xl">
                {formatKrw(summary.totalMarketValueKrw)}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
                <HeroMetric
                  label="오늘"
                  value={formatSignedKrw(summary.todayChangeKrw)}
                  rate={summary.todayChangeRate}
                  tone={pnlClass(summary.todayChangeKrw)}
                />
                <Dot />
                <HeroMetric
                  label="평가손익"
                  value={formatSignedKrw(summary.totalUnrealizedPnlKrw)}
                  rate={summary.totalUnrealizedPnlRate}
                  tone={pnlClass(summary.totalUnrealizedPnlKrw)}
                />
                <Dot />
                <HeroMetric
                  label="실현"
                  value={formatSignedKrw(summary.totalRealizedPnlKrw)}
                  tone={pnlClass(summary.totalRealizedPnlKrw)}
                />
              </div>
            </div>
            <div className="-mx-2">
              <EquityChart endValue={summary.totalMarketValueKrw} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>내 종목</CardTitle>
              <CardDescription>{summary.holdingsCount}개 보유</CardDescription>
            </CardHeader>
            <CardContent>
              <HoldingsPreview holdings={holdings} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>오늘의 종목</CardTitle>
              <CardDescription>변동률 큰 순</CardDescription>
            </CardHeader>
            <CardContent>
              {topMovers.length === 0 ? (
                <p className="text-sm text-muted-foreground">보유 종목 없음</p>
              ) : (
                <ul className="divide-y divide-border">
                  {topMovers.map((h) => (
                    <li
                      key={`${h.market}:${h.symbol}`}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {h.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {h.symbol}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "tabular text-sm font-semibold",
                          pnlClass(h.changeRate),
                        )}
                      >
                        {formatPercent(h.changeRate, { signed: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  );
}

function HeroMetric({
  label,
  value,
  rate,
  tone,
}: {
  label: string;
  value: string;
  rate?: number;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("tabular text-sm font-semibold", tone)}>{value}</span>
      {typeof rate === "number" ? (
        <span className={cn("text-xs tabular", tone)}>
          ({formatPercent(rate, { signed: true })})
        </span>
      ) : null}
    </div>
  );
}

function Dot() {
  return <span aria-hidden className="text-muted-foreground/60">·</span>;
}
