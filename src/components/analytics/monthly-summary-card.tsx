import { TrendingDown, TrendingUp } from "lucide-react";
import { formatKrw, formatSignedKrw } from "@/lib/format";
import type { EnrichedTrade } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

/*
  현재 달의 거래 요약 — 한 카드에 핵심 지표 모음. 매월 1일에 자동 리셋.

  - 실현손익(KRW): 이번 달 SELL 의 합
  - 매수 / 매도 건수
  - 평균 거래액 (KRW)
  - 잠재 양도세 (US 슬라이스 만 — 22% 단순화)
*/

const US_DEDUCTION_KRW = 2_500_000;
const US_TAX_RATE = 0.22;

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

export function MonthlySummaryCard({ trades }: { trades: EnrichedTrade[] }) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const thisMonth = trades.filter((t) => t.tradedAt.startsWith(ym));
  const sells = thisMonth.filter((t) => t.side === "SELL");
  const buys = thisMonth.filter((t) => t.side === "BUY");

  const realizedKrw = sells.reduce(
    (acc, t) => acc + (t.realizedPnlKrw ?? 0),
    0,
  );
  const usRealizedKrw = sells
    .filter((t) => t.market === "US")
    .reduce((acc, t) => acc + (t.realizedPnlKrw ?? 0), 0);
  const usTaxable = Math.max(0, usRealizedKrw - US_DEDUCTION_KRW);
  const usTaxEst = usTaxable * US_TAX_RATE;

  const totalGrossKrw = thisMonth.reduce(
    (acc, t) => acc + t.price * t.quantity * t.exchangeRate,
    0,
  );
  const avgTradeKrw =
    thisMonth.length > 0 ? totalGrossKrw / thisMonth.length : 0;

  const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {monthLabel}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span
            className={cn(
              "tabular text-2xl font-semibold leading-none",
              pnlClass(realizedKrw),
            )}
          >
            {realizedKrw === 0
              ? formatKrw(0)
              : formatSignedKrw(realizedKrw)}
          </span>
          <span className="text-xs text-muted-foreground">실현손익</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="매수"
          value={`${buys.length}건`}
          icon={<TrendingUp className="size-3.5 text-pos" strokeWidth={2} />}
        />
        <Stat
          label="매도"
          value={`${sells.length}건`}
          icon={<TrendingDown className="size-3.5 text-neg" strokeWidth={2} />}
        />
        <Stat label="평균 거래액" value={formatKrw(avgTradeKrw)} />
        <Stat
          label="예상 양도세 (US)"
          value={usTaxEst > 0 ? formatKrw(usTaxEst) : "—"}
          dim={usTaxEst === 0}
        />
      </div>

      {thisMonth.length === 0 && (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
          이번 달엔 아직 거래가 없어요.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  dim,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  dim?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 tabular text-sm font-medium",
          dim ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
