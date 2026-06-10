import { Award, Percent, TrendingDown, TrendingUp } from "lucide-react";
import { formatKrw } from "@/lib/format";
import { computeTradeStats } from "@/lib/analytics/trade-stats";
import type { EnrichedTrade } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

/*
  거래 통계 카드. 매도(SELL) 트레이드 기반:
  - Win Rate: 이익 본 매도 비율
  - 평균 수익률: 매도가 vs 매도 직전 평단
  - 최고 / 최저 종목 (누적 실현손익)
  - 평균 보유 일수
*/

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

export function TradeStatsCard({ trades }: { trades: EnrichedTrade[] }) {
  const s = computeTradeStats(trades);

  if (s.closedSells === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
        아직 매도 거래가 없어요. 매도가 발생하면 통계가 채워져요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Win Rate"
          value={`${s.winRate.toFixed(1)}%`}
          icon={<Percent className="size-3.5 text-pos" strokeWidth={2} />}
          accent={
            s.winRate >= 50 ? "text-pos" : s.winRate >= 30 ? undefined : "text-neg"
          }
        />
        <Stat
          label="평균 수익률"
          value={`${s.avgReturnPct >= 0 ? "+" : ""}${s.avgReturnPct.toFixed(2)}%`}
          icon={
            s.avgReturnPct >= 0 ? (
              <TrendingUp className="size-3.5 text-pos" strokeWidth={2} />
            ) : (
              <TrendingDown className="size-3.5 text-neg" strokeWidth={2} />
            )
          }
          accent={pnlClass(s.avgReturnPct)}
        />
        <Stat
          label="평균 보유 기간"
          value={
            s.avgHoldingDays > 0
              ? `${s.avgHoldingDays.toFixed(1)}일`
              : "—"
          }
        />
        <Stat
          label="청산 매매"
          value={`${s.closedSells}건 / ${s.totalTrades}건`}
        />
      </div>

      {s.bestSymbol && (
        <SymbolRow
          icon={<Award className="size-3.5 text-pos" strokeWidth={2} />}
          label="최고 수익 종목"
          name={s.bestSymbol.name}
          symbol={s.bestSymbol.symbol}
          gainKrw={s.bestSymbol.gainKrw}
        />
      )}
      {s.worstSymbol && s.worstSymbol.symbol !== s.bestSymbol?.symbol && (
        <SymbolRow
          icon={<TrendingDown className="size-3.5 text-neg" strokeWidth={2} />}
          label="최저 수익 종목"
          name={s.worstSymbol.name}
          symbol={s.worstSymbol.symbol}
          gainKrw={s.worstSymbol.gainKrw}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn("mt-0.5 tabular text-sm font-semibold", accent ?? "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

function SymbolRow({
  icon,
  label,
  name,
  symbol,
  gainKrw,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  symbol: string;
  gainKrw: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2">
      <div className="flex items-center gap-2 text-xs">
        {icon}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{name}</div>
        <div className="flex items-center justify-end gap-2 text-xs">
          <span className="text-muted-foreground">{symbol}</span>
          <span className={cn("tabular font-semibold", pnlClass(gainKrw))}>
            {gainKrw >= 0 ? "+" : ""}
            {formatKrw(gainKrw)}
          </span>
        </div>
      </div>
    </div>
  );
}
