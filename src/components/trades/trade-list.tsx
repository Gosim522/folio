"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatKrw, formatNumber, formatSignedKrw, formatUsd } from "@/lib/format";
import type { EnrichedTrade, Side } from "@/lib/portfolio/types";
import type { Market } from "@/lib/quotes/types";
import { cn } from "@/lib/utils";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

type SideFilter = "all" | Side;
type MarketFilter = "all" | Market;
type SortKey = "time" | "amount" | "realized";

export function TradeList({ trades }: { trades: EnrichedTrade[] }) {
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("time");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = trades.filter((t) => {
      if (sideFilter !== "all" && t.side !== sideFilter) return false;
      if (marketFilter !== "all" && t.market !== marketFilter) return false;
      if (q) {
        const hay = `${t.name} ${t.symbol} ${t.note ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...matched];
    if (sortKey === "amount") {
      sorted.sort(
        (a, b) =>
          b.price * b.quantity * b.exchangeRate -
          a.price * a.quantity * a.exchangeRate,
      );
    } else if (sortKey === "realized") {
      sorted.sort((a, b) => (b.realizedPnlKrw ?? -Infinity) - (a.realizedPnlKrw ?? -Infinity));
    }
    // else "time" — 이미 buildPortfolio 가 DESC (최신부터) 정렬해서 넘김.
    return sorted;
  }, [trades, query, sideFilter, marketFilter, sortKey]);

  const anyFilter = query.trim() !== "" || sideFilter !== "all" || marketFilter !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="종목명·코드·메모 검색 ( / )"
            className="h-8 pl-8 text-xs"
            data-shortcut="trade-search"
          />
        </div>
        <ToggleGroup
          value={sideFilter}
          onChange={setSideFilter}
          options={[
            { value: "all", label: "전체" },
            { value: "BUY", label: "매수" },
            { value: "SELL", label: "매도" },
          ]}
        />
        <ToggleGroup
          value={marketFilter}
          onChange={setMarketFilter}
          options={[
            { value: "all", label: "전체" },
            { value: "KR", label: "국내" },
            { value: "US", label: "해외" },
          ]}
        />
        <ToggleGroup
          value={sortKey}
          onChange={setSortKey}
          options={[
            { value: "time", label: "시간" },
            { value: "amount", label: "거래액" },
            { value: "realized", label: "실현손익" },
          ]}
        />
      </div>

      {anyFilter && (
        <div className="text-xs text-muted-foreground">
          {filtered.length}건 · 전체 {trades.length}건 중
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 text-left">일시</th>
              <th className="px-3 py-3 text-left">종목</th>
              <th className="px-3 py-3 text-left">구분</th>
              <th className="px-3 py-3 text-right">수량</th>
              <th className="px-3 py-3 text-right">단가</th>
              <th className="px-3 py-3 text-right">거래금액</th>
              <th className="px-5 py-3 text-right">실현손익</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const isKr = t.market === "KR";
              const localPrice = isKr ? formatKrw(t.price) : formatUsd(t.price);
              const localGross = isKr ? formatKrw(t.price * t.quantity) : formatUsd(t.price * t.quantity);
              const grossKrw = t.price * t.quantity * t.exchangeRate;
              const isBuy = t.side === "BUY";
              const d = new Date(t.tradedAt);

              return (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <div className="tabular text-sm">{dateFmt.format(d)}</div>
                    <div className="tabular text-xs text-muted-foreground">{timeFmt.format(d)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t.market}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        isBuy ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg",
                      )}
                    >
                      {isBuy ? "매수" : "매도"}
                    </span>
                    {t.note ? (
                      <div className="mt-1 text-xs text-muted-foreground">{t.note}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-right tabular">
                    {formatNumber(t.quantity, { decimals: !Number.isInteger(t.quantity) })}
                  </td>
                  <td className="px-3 py-3 text-right tabular">
                    <div>{localPrice}</div>
                    {!isKr ? (
                      <div className="text-xs text-muted-foreground">@ {t.exchangeRate.toLocaleString("ko-KR")}원</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-right tabular">
                    <div className="font-medium">{formatKrw(grossKrw)}</div>
                    {!isKr ? (
                      <div className="text-xs text-muted-foreground">{localGross}</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {t.side === "SELL" && typeof t.realizedPnlKrw === "number" ? (
                      <div className={cn("tabular font-medium", pnlClass(t.realizedPnlKrw))}>
                        {formatSignedKrw(t.realizedPnlKrw)}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && anyFilter && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">
                  필터 조건에 맞는 거래가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ToggleOption<T extends string> = { value: T; label: string };

function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: ToggleOption<T>[];
}) {
  return (
    <div className="flex items-center rounded-md bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
