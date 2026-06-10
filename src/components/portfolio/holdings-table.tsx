"use client";

import { useState } from "react";
import { formatKrw, formatNumber, formatPercent, formatSignedKrw, formatUsd } from "@/lib/format";
import type { Holding, Trade } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";
import { HoldingHistoryModal } from "./holding-history-modal";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

function formatLocalPrice(h: Holding, value: number) {
  return h.market === "KR" ? formatKrw(value) : formatUsd(value);
}

type Props = {
  holdings: Holding[];
  /** 종목 클릭 시 히스토리 모달용 — 전달 안 하면 클릭 비활성. */
  allTrades?: Trade[];
};

export function HoldingsTable({ holdings, allTrades }: Props) {
  const [active, setActive] = useState<Holding | null>(null);
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 text-left">종목</th>
              <th className="px-3 py-3 text-right">수량</th>
              <th className="px-3 py-3 text-right">평균단가</th>
              <th className="px-3 py-3 text-right">현재가</th>
              <th className="px-3 py-3 text-right">평가금액</th>
              <th className="px-3 py-3 text-right">평가손익</th>
              <th className="px-5 py-3 text-right">비중</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr
                key={`${h.market}:${h.symbol}`}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {h.market}
                    </span>
                    <div className="min-w-0">
                      {allTrades ? (
                        <button
                          type="button"
                          onClick={() => setActive(h)}
                          className="block min-w-0 text-left truncate font-medium hover:text-pos transition-colors"
                          title="매매 히스토리 보기"
                        >
                          {h.name}
                        </button>
                      ) : (
                        <div className="truncate font-medium">{h.name}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{h.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular">
                  {formatNumber(h.quantity, { decimals: !Number.isInteger(h.quantity) })}
                </td>
                <td className="px-3 py-3 text-right tabular text-muted-foreground">
                  {formatLocalPrice(h, h.avgPrice)}
                </td>
                <td className="px-3 py-3 text-right tabular">{formatLocalPrice(h, h.currentPrice)}</td>
                <td className="px-3 py-3 text-right tabular font-medium">
                  {formatKrw(h.marketValueKrw)}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className={cn("tabular font-medium", pnlClass(h.unrealizedPnlKrw))}>
                    {formatSignedKrw(h.unrealizedPnlKrw)}
                  </div>
                  <div className={cn("text-xs tabular", pnlClass(h.unrealizedPnlKrw))}>
                    {formatPercent(h.unrealizedPnlRate, { signed: true })}
                  </div>
                </td>
                <td className="px-5 py-3 text-right tabular text-muted-foreground">
                  {h.weight.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {active && allTrades && (
        <HoldingHistoryModal
          symbol={active.symbol}
          market={active.market}
          name={active.name}
          trades={allTrades}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
