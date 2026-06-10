import { ActivityChart } from "@/components/analytics/activity-chart";
import { MarketBreakdownView } from "@/components/analytics/market-breakdown";
import { MonthlyPnlChart } from "@/components/analytics/monthly-pnl-chart";
import { MonthlySummaryCard } from "@/components/analytics/monthly-summary-card";
import { PortfolioHealthCard } from "@/components/analytics/portfolio-health-card";
import { TaxCard } from "@/components/analytics/tax-card";
import { TradeStatsCard } from "@/components/analytics/trade-stats-card";
import { JournalPanel } from "@/components/journal/journal-panel";
import { EquityChart } from "@/components/dashboard/equity-chart";
import { HeatmapRefreshButton } from "@/components/dashboard/heatmap-refresh-button";
import { HoldingsPreview } from "@/components/dashboard/holdings-preview";
import { MarketHeatmap } from "@/components/dashboard/market-heatmap";
import { MarketStrip } from "@/components/dashboard/market-strip";
import { EconomicCalendar } from "@/components/calendar/economic-calendar";
import { JournalPrompts } from "@/components/journal/journal-prompts";
import { SectorPerformance } from "@/components/market/sector-performance";
import { AllocationPanel } from "@/components/portfolio/allocation-panel";
import { FxGainPanel } from "@/components/portfolio/fx-gain-panel";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { MarketClock } from "@/components/quotes/market-clock";
import { QuoteList } from "@/components/quotes/quote-list";
import { BuySellRatio } from "@/components/trades/buy-sell-ratio";
import { ExportTradesButton } from "@/components/trades/export-button";
import { PaperTrading } from "@/components/trades/paper-trading";
import { TradeCalendar } from "@/components/trades/trade-calendar";
import { TradeList } from "@/components/trades/trade-list";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatKrw,
  formatPercent,
  formatSignedKrw,
} from "@/lib/format";
import {
  marketBreakdown,
  monthlyActivity,
  monthlyRealizedPnl,
  taxSimulation,
} from "@/lib/analytics/service";
import type { PortfolioResult } from "@/lib/portfolio/types";
import type { HeatmapSector } from "@/lib/quotes/heatmap";
import type { StripIndex } from "@/lib/quotes/indices";
import type { SectorReturn } from "@/lib/quotes/sectors";
import type { Quote } from "@/lib/quotes/types";
import type { WidgetId } from "@/lib/widgets/types";
import { cn } from "@/lib/utils";

type Ctx = {
  portfolio: PortfolioResult;
  strip: StripIndex[];
  quotes: Quote[];
  fetchedAt: number;
  heatmap: HeatmapSector[];
  sectors: SectorReturn[];
};

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

export function buildWidgetNodes(
  ctx: Ctx,
): Partial<Record<WidgetId, React.ReactNode>> {
  const { portfolio, strip, quotes, fetchedAt, heatmap, sectors } = ctx;
  const { holdings, summary, trades } = portfolio;

  const krCount = holdings.filter((h) => h.market === "KR").length;
  const usCount = holdings.filter((h) => h.market === "US").length;
  const topMovers = [...holdings]
    .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate))
    .slice(0, 6);
  const totalBuys = trades.filter((t) => t.side === "BUY").length;
  const totalSells = trades.filter((t) => t.side === "SELL").length;
  const monthlyPnl = monthlyRealizedPnl(trades);
  const activity = monthlyActivity(trades);
  const breakdown = marketBreakdown(holdings);
  const tax = taxSimulation(trades);
  const usdKrw = strip.find((s) => s.key === "USDKRW")?.price ?? 0;

  return {
    "market-strip": <MarketStrip items={strip} />,

    "asset-summary": (
      <Card className="overflow-hidden">
        <CardContent className="space-y-2 p-6 md:p-8">
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
        </CardContent>
      </Card>
    ),

    "equity-chart": (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>자산 변화</CardTitle>
          <CardDescription>기간을 골라 자산 추이를 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="-mx-2">
            <EquityChart endValue={summary.totalMarketValueKrw} />
          </div>
        </CardContent>
      </Card>
    ),

    "holdings-preview": (
      <Card>
        <CardHeader>
          <CardTitle>내 종목</CardTitle>
          <CardDescription>{summary.holdingsCount}개 보유</CardDescription>
        </CardHeader>
        <CardContent>
          <HoldingsPreview holdings={holdings} />
        </CardContent>
      </Card>
    ),

    "top-movers": (
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
    ),

    "quote-list": (
      <Card>
        <CardHeader>
          <CardTitle>시세</CardTitle>
          <CardDescription>
            Yahoo Finance 공개 데이터 — 시세는 15분 정도 지연될 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuoteList initialQuotes={quotes} initialFetchedAt={fetchedAt} />
        </CardContent>
      </Card>
    ),

    "market-clock": (
      <Card>
        <CardHeader>
          <CardTitle>시장 시계</CardTitle>
          <CardDescription>한국·미국 장 상태와 다음 개장/마감</CardDescription>
        </CardHeader>
        <CardContent>
          <MarketClock />
        </CardContent>
      </Card>
    ),

    "economic-calendar": (
      <Card>
        <CardHeader>
          <CardTitle>주요 일정</CardTitle>
          <CardDescription>
            FOMC·CPI·금통위·실적 — 중요도 별 ★로 표시
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EconomicCalendar />
        </CardContent>
      </Card>
    ),

    "market-heatmap": (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>시장 트리맵</CardTitle>
          <CardDescription>
            S&P 500 섹터·종목 — 칸 크기는 시가총액, 색은 당일 변동률
          </CardDescription>
          <CardAction>
            <HeatmapRefreshButton />
          </CardAction>
        </CardHeader>
        <CardContent>
          <MarketHeatmap sectors={heatmap} />
        </CardContent>
      </Card>
    ),

    "sector-performance": (
      <Card>
        <CardHeader>
          <CardTitle>섹터별 변동률</CardTitle>
          <CardDescription>
            11개 SPDR 섹터 ETF — 기간 선택 가능
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectorPerformance sectors={sectors} />
        </CardContent>
      </Card>
    ),

    "portfolio-kpi": (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="평가금액"
          value={formatKrw(summary.totalMarketValueKrw)}
          sub={`투자원금 ${formatKrw(summary.totalInvestedKrw)}`}
        />
        <KpiCard
          label="평가손익"
          value={formatSignedKrw(summary.totalUnrealizedPnlKrw)}
          valueClassName={pnlClass(summary.totalUnrealizedPnlKrw)}
          sub={
            <span className={pnlClass(summary.totalUnrealizedPnlKrw)}>
              {formatPercent(summary.totalUnrealizedPnlRate, { signed: true })}
            </span>
          }
        />
        <KpiCard
          label="오늘 변동"
          value={formatSignedKrw(summary.todayChangeKrw)}
          valueClassName={pnlClass(summary.todayChangeKrw)}
          sub={
            <span className={pnlClass(summary.todayChangeKrw)}>
              {formatPercent(summary.todayChangeRate, { signed: true })}
            </span>
          }
        />
        <KpiCard
          label="실현손익"
          value={formatSignedKrw(summary.totalRealizedPnlKrw)}
          valueClassName={pnlClass(summary.totalRealizedPnlKrw)}
          sub="누적 기준"
        />
      </div>
    ),

    "allocation-panel": (
      <Card>
        <CardHeader>
          <CardTitle>비중</CardTitle>
          <CardDescription>
            보유 종목 {summary.holdingsCount}개 · 국내 {krCount} · 해외 {usCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AllocationPanel holdings={holdings} />
        </CardContent>
      </Card>
    ),

    "holdings-table": (
      <Card>
        <CardHeader>
          <CardTitle>보유 종목</CardTitle>
          <CardDescription>현재가는 공개 API로부터 가져옵니다</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <HoldingsTable holdings={holdings} allTrades={trades} />
        </CardContent>
      </Card>
    ),

    "fx-gain": (
      <Card>
        <CardHeader>
          <CardTitle>달러 환차손익</CardTitle>
          <CardDescription>
            원/달러 환율 변동만 떼어 계산 — 평가손익에 포함된 금액
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FxGainPanel holdings={holdings} currentRate={usdKrw} />
        </CardContent>
      </Card>
    ),

    "trade-list": (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>거래 내역</CardTitle>
              <CardDescription>
                총 {trades.length}건 · 매수 {totalBuys} · 매도 {totalSells}
              </CardDescription>
            </div>
            <ExportTradesButton trades={trades} />
          </div>
        </CardHeader>
        <CardContent>
          <TradeList trades={trades} />
        </CardContent>
      </Card>
    ),

    "trade-calendar": (
      <Card>
        <CardHeader>
          <CardTitle>거래 캘린더</CardTitle>
          <CardDescription>최근 1년 일별 거래 빈도</CardDescription>
        </CardHeader>
        <CardContent>
          <TradeCalendar trades={trades} />
        </CardContent>
      </Card>
    ),

    "buy-sell-ratio": (
      <Card>
        <CardHeader>
          <CardTitle>매수·매도 비율</CardTitle>
          <CardDescription>거래 금액(원화) 기준</CardDescription>
        </CardHeader>
        <CardContent>
          <BuySellRatio trades={trades} />
        </CardContent>
      </Card>
    ),

    "paper-trading": (
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>모의 투자</CardTitle>
          <CardDescription>
            가상 매수·매도로 전략을 연습 — 실제 주문이 아닙니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaperTrading
            initialQuotes={quotes}
            initialFetchedAt={fetchedAt}
            usdKrw={usdKrw}
          />
        </CardContent>
      </Card>
    ),

    "monthly-summary": (
      <Card>
        <CardHeader>
          <CardTitle>이번 달 요약</CardTitle>
          <CardDescription>실현손익·매매 건수·평균 거래액·예상 세금</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlySummaryCard trades={trades} />
        </CardContent>
      </Card>
    ),

    "trade-stats": (
      <Card>
        <CardHeader>
          <CardTitle>거래 통계</CardTitle>
          <CardDescription>매도(SELL) 기반 · Win Rate · 평균 수익률</CardDescription>
        </CardHeader>
        <CardContent>
          <TradeStatsCard trades={trades} />
        </CardContent>
      </Card>
    ),

    "portfolio-health": (
      <Card>
        <CardHeader>
          <CardTitle>포트폴리오 진단</CardTitle>
          <CardDescription>집중도·손실 비중·다변화 종합 점수</CardDescription>
        </CardHeader>
        <CardContent>
          <PortfolioHealthCard holdings={holdings} />
        </CardContent>
      </Card>
    ),

    "monthly-pnl": (
      <Card>
        <CardHeader>
          <CardTitle>월별 실현손익</CardTitle>
          <CardDescription>
            매도 거래에서 발생한 실현손익을 월 단위로 합산
          </CardDescription>
        </CardHeader>
        <CardContent className="pr-2">
          {monthlyPnl.length === 0 ? (
            <div className="flex h-60 items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
              실현된 거래가 아직 없어요
            </div>
          ) : (
            <MonthlyPnlChart data={monthlyPnl} />
          )}
        </CardContent>
      </Card>
    ),

    "activity-chart": (
      <Card>
        <CardHeader>
          <CardTitle>거래 활동</CardTitle>
          <CardDescription>월별 매수 · 매도 횟수</CardDescription>
        </CardHeader>
        <CardContent className="pr-2">
          {activity.length === 0 ? (
            <div className="flex h-60 items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
              거래가 없어요
            </div>
          ) : (
            <ActivityChart data={activity} />
          )}
        </CardContent>
      </Card>
    ),

    "market-breakdown": (
      <Card>
        <CardHeader>
          <CardTitle>시장별 자산</CardTitle>
          <CardDescription>평가금액 기준</CardDescription>
        </CardHeader>
        <CardContent>
          <MarketBreakdownView data={breakdown} />
        </CardContent>
      </Card>
    ),

    "tax-card": (
      <Card>
        <CardHeader>
          <CardTitle>세금 시뮬레이션</CardTitle>
          <CardDescription>실현된 양도손익 기준 — 참고용</CardDescription>
        </CardHeader>
        <CardContent>
          <TaxCard tax={tax} />
        </CardContent>
      </Card>
    ),

    journal: (
      <Card>
        <CardHeader>
          <CardTitle>매매일지</CardTitle>
          <CardDescription>
            거래 결정과 회고를 남기는 공간 — 로컬 저장
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JournalPanel />
        </CardContent>
      </Card>
    ),

    "journal-prompts": (
      <Card>
        <CardHeader>
          <CardTitle>회고 질문</CardTitle>
          <CardDescription>오늘의 매매일지 시작점 — 매일 자동 갱신</CardDescription>
        </CardHeader>
        <CardContent>
          <JournalPrompts />
        </CardContent>
      </Card>
    ),
  };
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
  return (
    <span aria-hidden className="text-muted-foreground/60">
      ·
    </span>
  );
}

function KpiCard({
  label,
  value,
  valueClassName,
  sub,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  sub?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-2 p-5">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={cn("tabular text-2xl font-semibold", valueClassName)}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
