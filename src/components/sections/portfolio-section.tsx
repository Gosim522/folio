import { PageHeader } from "@/components/common/page-header";
import { AllocationPanel } from "@/components/portfolio/allocation-panel";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKrw, formatPercent, formatSignedKrw } from "@/lib/format";
import type { PortfolioResult } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";
import { Section } from "./section";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

export function PortfolioSection({ portfolio }: { portfolio: PortfolioResult }) {
  const { holdings, summary } = portfolio;
  const krCount = holdings.filter((h) => h.market === "KR").length;
  const usCount = holdings.filter((h) => h.market === "US").length;

  return (
    <Section id="portfolio">
      <div className="space-y-6">
        <PageHeader
          title="포트폴리오"
          description={`보유 종목 ${summary.holdingsCount}개 · 국내 ${krCount} · 해외 ${usCount}`}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetaCard
            label="평가금액"
            value={formatKrw(summary.totalMarketValueKrw)}
            sub={`투자원금 ${formatKrw(summary.totalInvestedKrw)}`}
          />
          <MetaCard
            label="평가손익"
            value={formatSignedKrw(summary.totalUnrealizedPnlKrw)}
            valueClassName={pnlClass(summary.totalUnrealizedPnlKrw)}
            sub={
              <span className={pnlClass(summary.totalUnrealizedPnlKrw)}>
                {formatPercent(summary.totalUnrealizedPnlRate, { signed: true })}
              </span>
            }
          />
          <MetaCard
            label="오늘 변동"
            value={formatSignedKrw(summary.todayChangeKrw)}
            valueClassName={pnlClass(summary.todayChangeKrw)}
            sub={
              <span className={pnlClass(summary.todayChangeKrw)}>
                {formatPercent(summary.todayChangeRate, { signed: true })}
              </span>
            }
          />
          <MetaCard
            label="실현손익"
            value={formatSignedKrw(summary.totalRealizedPnlKrw)}
            valueClassName={pnlClass(summary.totalRealizedPnlKrw)}
            sub="누적 기준"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>비중</CardTitle>
              <CardDescription>보기와 기준을 골라서 보세요</CardDescription>
            </CardHeader>
            <CardContent>
              <AllocationPanel holdings={holdings} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>보유 종목</CardTitle>
              <CardDescription>현재가는 공개 API로부터 가져옵니다</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <HoldingsTable holdings={holdings} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  );
}

function MetaCard({
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
        <div className={cn("tabular text-2xl font-semibold", valueClassName)}>{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
