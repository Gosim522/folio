"use client";

import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  formatKrw,
  formatNumber,
  formatSignedKrw,
  formatUsd,
} from "@/lib/format";
import { buildPortfolio } from "@/lib/portfolio/service";
import type { EnrichedTrade, Trade } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

/*
  특정 종목의 모든 매매·평단 변화·누적 수량을 한 모달에 정리. 클릭 진입.

  현재 보유 평단·평가손익에 어떻게 도달했는지 사용자가 사후 감사하기 위함. 모달
  안에서는 외부 시세 조회 없이, 전달받은 trades 만 가지고 buildPortfolio 를 재실행해
  enriched (avgPriceAfter, quantityAfter) 값을 사용.
*/

type Props = {
  symbol: string;
  market: "KR" | "US";
  name: string;
  trades: Trade[];
  onClose: () => void;
};

function fmtPrice(market: "KR" | "US", v: number): string {
  return market === "KR" ? formatKrw(v) : formatUsd(v);
}

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
});

export function HoldingHistoryModal({
  symbol,
  market,
  name,
  trades,
  onClose,
}: Props) {
  // Esc 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const symbolTrades = useMemo(
    () =>
      trades.filter((t) => t.symbol === symbol && t.market === market),
    [trades, symbol, market],
  );

  // buildPortfolio 를 그 종목만으로 다시 돌려 avgPriceAfter / quantityAfter 를 얻음.
  // 외부 quotes/fx 없이도 동작 — 평단·실현손익 계산엔 시세 불필요.
  const enrichedReversed: EnrichedTrade[] = useMemo(() => {
    const r = buildPortfolio(symbolTrades);
    // buildPortfolio 는 최신순(DESC) 으로 반환 — 시간순(ASC) 으로 뒤집어 평단 변화를
    // 자연스럽게 보여줌.
    return [...r.trades].reverse();
  }, [symbolTrades]);

  const totalBuys = enrichedReversed.filter((t) => t.side === "BUY").length;
  const totalSells = enrichedReversed.filter((t) => t.side === "SELL").length;
  const totalRealized = enrichedReversed.reduce(
    (acc, t) => acc + (t.realizedPnlKrw ?? 0),
    0,
  );
  const currentQty = enrichedReversed[enrichedReversed.length - 1]?.quantityAfter ?? 0;
  const currentAvg =
    enrichedReversed[enrichedReversed.length - 1]?.avgPriceAfter ?? 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} 매매 히스토리`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-floating"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                {market}
              </span>
              <h2 className="text-base font-semibold">{name}</h2>
              <span className="text-xs text-muted-foreground">{symbol}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              매수 {totalBuys}건 · 매도 {totalSells}건 · 보유 {currentQty}주 ·
              평단 {fmtPrice(market, currentAvg)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {enrichedReversed.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            이 종목에 대한 거래 기록이 없어요.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 text-left">일시</th>
                  <th className="px-3 py-2 text-left">구분</th>
                  <th className="px-3 py-2 text-right">수량</th>
                  <th className="px-3 py-2 text-right">단가</th>
                  <th className="px-3 py-2 text-right">실현손익</th>
                  <th className="px-3 py-2 text-right">평단 변화</th>
                  <th className="px-3 py-2 text-right">누적 수량</th>
                </tr>
              </thead>
              <tbody>
                {enrichedReversed.map((t, idx) => {
                  const isBuy = t.side === "BUY";
                  const avgBefore =
                    idx === 0
                      ? 0
                      : enrichedReversed[idx - 1].avgPriceAfter;
                  const avgDelta = t.avgPriceAfter - avgBefore;
                  return (
                    <tr
                      key={t.id}
                      className="border-t border-border first:border-t-0"
                    >
                      <td className="px-3 py-2 tabular text-xs">
                        {dateFmt.format(new Date(t.tradedAt))}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            isBuy
                              ? "bg-pos-soft text-pos"
                              : "bg-neg-soft text-neg",
                          )}
                        >
                          {isBuy ? "매수" : "매도"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular">
                        {formatNumber(t.quantity, {
                          decimals: !Number.isInteger(t.quantity),
                        })}
                      </td>
                      <td className="px-3 py-2 text-right tabular">
                        {fmtPrice(market, t.price)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {t.side === "SELL" &&
                        typeof t.realizedPnlKrw === "number" ? (
                          <span
                            className={cn(
                              "tabular text-xs font-medium",
                              t.realizedPnlKrw >= 0 ? "text-pos" : "text-neg",
                            )}
                          >
                            {formatSignedKrw(t.realizedPnlKrw)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular text-xs">
                        {fmtPrice(market, t.avgPriceAfter)}
                        {idx > 0 && avgDelta !== 0 && (
                          <span
                            className={cn(
                              "ml-1 text-[10px]",
                              avgDelta > 0
                                ? "text-muted-foreground"
                                : "text-pos",
                            )}
                          >
                            ({avgDelta > 0 ? "+" : ""}
                            {fmtPrice(market, avgDelta)})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular text-xs text-muted-foreground">
                        {t.quantityAfter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/40">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground">
                    누적 실현손익
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right tabular text-sm font-semibold",
                      totalRealized > 0
                        ? "text-pos"
                        : totalRealized < 0
                          ? "text-neg"
                          : "text-muted-foreground",
                    )}
                  >
                    {totalRealized === 0 ? "—" : formatSignedKrw(totalRealized)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
