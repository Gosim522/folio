import {
  formatNumber,
  formatPercent,
  formatSignedKrw,
  formatUsd,
} from "@/lib/format";
import type { Holding } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

/** KRW per USD, shown with 2 decimals — e.g. "1,355.20원". */
function formatRate(rate: number) {
  if (!Number.isFinite(rate)) return "—";
  return `${formatNumber(rate, { decimals: true })}원`;
}

type Props = {
  holdings: Holding[];
  /** Live USD/KRW rate. */
  currentRate: number;
};

/**
 * Isolates the FX (won/dollar) component of unrealized PnL on US holdings.
 * For each holding: usdCostBasis × (currentRate − avgBuyRate).
 */
export function FxGainPanel({ holdings, currentRate }: Props) {
  const usHoldings = holdings.filter((h) => h.market === "US");

  if (usHoldings.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        보유 중인 해외(달러) 종목이 없어요.
        <br />
        미국 주식을 매수하면 환율 손익이 여기 표시됩니다.
      </p>
    );
  }

  if (!Number.isFinite(currentRate) || currentRate <= 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        현재 환율을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
      </p>
    );
  }

  const rows = usHoldings.map((h) => {
    const usdCost = h.avgPrice * h.quantity;
    const usdValue = h.currentPrice * h.quantity;
    return {
      h,
      usdCost,
      usdValue,
      fxOnCost: usdCost * (currentRate - h.avgExchangeRate),
      fxOnValue: usdValue * (currentRate - h.avgExchangeRate),
    };
  });

  const totalUsdCost = rows.reduce((a, r) => a + r.usdCost, 0);
  const totalFxOnCost = rows.reduce((a, r) => a + r.fxOnCost, 0);
  const totalFxOnValue = rows.reduce((a, r) => a + r.fxOnValue, 0);
  // cost-weighted average buy rate == Σ investedKrw / Σ usdCost
  const investedKrw = rows.reduce((a, r) => a + r.h.investedKrw, 0);
  const weightedAvgRate = totalUsdCost > 0 ? investedKrw / totalUsdCost : currentRate;
  const rateChangeRate =
    weightedAvgRate > 0 ? ((currentRate - weightedAvgRate) / weightedAvgRate) * 100 : 0;

  const sorted = [...rows].sort(
    (a, b) => Math.abs(b.fxOnCost) - Math.abs(a.fxOnCost),
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">환차손익 · 투자원금 기준</div>
        <div
          className={cn(
            "tabular text-3xl font-semibold tracking-tight md:text-4xl",
            pnlClass(totalFxOnCost),
          )}
        >
          {formatSignedKrw(totalFxOnCost)}
        </div>
        <div className="text-sm text-muted-foreground">
          평균 매수 환율{" "}
          <span className="tabular text-foreground">{formatRate(weightedAvgRate)}</span>
          {" → 현재 "}
          <span className="tabular text-foreground">{formatRate(currentRate)}</span>{" "}
          <span className={cn("tabular", pnlClass(rateChangeRate))}>
            ({formatPercent(rateChangeRate, { signed: true })})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="보유 달러 (원금)" value={formatUsd(totalUsdCost)} />
        <Stat
          label="평가액 기준 환차손익"
          value={formatSignedKrw(totalFxOnValue)}
          valueClass={pnlClass(totalFxOnValue)}
        />
      </div>

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          종목별
        </div>
        <div className="divide-y divide-border">
          {sorted.map(({ h, usdCost, fxOnCost }) => (
            <div
              key={`${h.market}:${h.symbol}`}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{h.name}</div>
                <div className="mt-0.5 tabular text-xs text-muted-foreground">
                  {formatUsd(usdCost)} · 매수 {formatRate(h.avgExchangeRate)}
                </div>
              </div>
              <div
                className={cn(
                  "shrink-0 tabular text-sm font-semibold",
                  pnlClass(fxOnCost),
                )}
              >
                {formatSignedKrw(fxOnCost)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        환차손익은 평가손익에 이미 포함된 금액으로, 주가가 아닌 원/달러 환율 변동만
        따로 떼어 계산한 값입니다.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 tabular text-base font-semibold", valueClass)}>
        {value}
      </div>
    </div>
  );
}
