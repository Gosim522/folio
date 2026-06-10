import { ActivityChart } from "@/components/analytics/activity-chart";
import { MarketBreakdownView } from "@/components/analytics/market-breakdown";
import { MonthlyPnlChart } from "@/components/analytics/monthly-pnl-chart";
import { TaxCard } from "@/components/analytics/tax-card";
import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  marketBreakdown,
  monthlyActivity,
  monthlyRealizedPnl,
  taxSimulation,
} from "@/lib/analytics/service";
import type { PortfolioResult } from "@/lib/portfolio/types";
import { Section } from "./section";

export function AnalyticsSection({ portfolio }: { portfolio: PortfolioResult }) {
  const { trades, holdings } = portfolio;
  const monthlyPnl = monthlyRealizedPnl(trades);
  const activity = monthlyActivity(trades);
  const breakdown = marketBreakdown(holdings);
  const tax = taxSimulation(trades);

  return (
    <Section id="analytics">
      <div className="space-y-6">
        <PageHeader
          title="분석"
          description="실현손익 추이 · 거래 패턴 · 시장별 자산 비중 · 세금 시뮬레이션"
        />

        <Card>
          <CardHeader>
            <CardTitle>월별 실현손익</CardTitle>
            <CardDescription>매도 거래에서 발생한 실현손익을 월 단위로 합산</CardDescription>
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

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
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

          <Card>
            <CardHeader>
              <CardTitle>시장별 자산</CardTitle>
              <CardDescription>평가금액 기준</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketBreakdownView data={breakdown} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>세금 시뮬레이션</CardTitle>
            <CardDescription>실현된 양도손익 기준 — 참고용</CardDescription>
          </CardHeader>
          <CardContent>
            <TaxCard tax={tax} />
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
