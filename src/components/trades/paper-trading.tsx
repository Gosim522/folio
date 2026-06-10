"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RefreshCw, RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreference } from "@/hooks/use-preferences";
import {
  formatKrw,
  formatPercent,
  formatSignedKrw,
  formatUsd,
} from "@/lib/format";
import { PREF_DEFAULTS, PREF_KEYS, type PaperSort } from "@/lib/preferences";
import { buildPortfolio } from "@/lib/portfolio/service";
import type { Holding, Trade } from "@/lib/portfolio/types";
import { searchSymbols } from "@/lib/quotes/symbols";
import type { Market, Quote, SymbolEntry } from "@/lib/quotes/types";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

type Props = {
  initialQuotes: Quote[];
  initialFetchedAt: number;
  /** Live USD/KRW rate — frozen onto US trades at trade time. */
  usdKrw: number;
};

type Mode = "buy" | "sell";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

function formatLocal(market: string, value: number) {
  return market === "KR" ? formatKrw(value) : formatUsd(value);
}

function displayName(e: { name: string; nameKo?: string }) {
  return e.nameKo ?? e.name;
}

/** Current price → editable input string: integer for KR, 2 decimals for US. */
function priceToInput(price: number, market: Market) {
  return market === "KR" ? String(Math.round(price)) : price.toFixed(2);
}

/**
 * Virtual buy/sell sandbox. Trades are stored in localStorage (separate from the
 * real SAMPLE_TRADES feed) and replayed through the shared portfolio engine.
 * Symbols are searched by ticker / English / Korean name against SYMBOL_CATALOG;
 * quotes outside the initial watchlist are fetched on demand. Buy and sell prices
 * are user-editable — they default to the live price but can be overridden.
 */
export function PaperTrading({ initialQuotes, initialFetchedAt, usdKrw }: Props) {
  const [trades, setTrades] = usePreference<Trade[]>(
    PREF_KEYS.paperTrades,
    PREF_DEFAULTS.paperTrades,
  );
  const [sort, setSort] = usePreference<PaperSort>(
    PREF_KEYS.paperSort,
    PREF_DEFAULTS.paperSort,
  );
  const [paperOrder, setPaperOrder] = usePreference<string[]>(
    PREF_KEYS.paperOrder,
    PREF_DEFAULTS.paperOrder,
  );
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const quotesRef = useRef(quotes);
  const [fetchedAt, setFetchedAt] = useState(initialFetchedAt);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const lastClickRef = useRef(0);

  // Trade form state
  const [mode, setMode] = useState<Mode>("buy");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<SymbolEntry | null>(null);
  const [sellSymbol, setSellSymbol] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [qtyInput, setQtyInput] = useState("1");
  const comboRef = useRef<HTMLDivElement>(null);
  const [prevPriceKey, setPrevPriceKey] = useState<string | null>(null);
  const [remote, setRemote] = useState<{ query: string; items: SymbolEntry[] }>(
    { query: "", items: [] },
  );

  const quotesMap = useMemo(() => {
    const m = new Map<string, Quote>();
    for (const q of quotes) m.set(q.symbol, q);
    return m;
  }, [quotes]);

  const portfolio = useMemo(
    () => buildPortfolio(trades, quotesMap),
    [trades, quotesMap],
  );
  // Display order per the user's choice. "loss" (default) keeps the prime
  // "+1주" averaging-down candidates on top.
  const holdings = useMemo(() => {
    const list = [...portfolio.holdings];
    switch (sort) {
      case "gain":
        list.sort((a, b) => b.unrealizedPnlRate - a.unrealizedPnlRate);
        break;
      case "value":
        list.sort((a, b) => b.marketValueKrw - a.marketValueKrw);
        break;
      case "quantity":
        list.sort((a, b) => b.quantity - a.quantity);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
        break;
      case "custom": {
        const idx = new Map(paperOrder.map((s, i) => [s, i]));
        list.sort((a, b) => {
          const ia = idx.get(a.symbol) ?? Number.MAX_SAFE_INTEGER;
          const ib = idx.get(b.symbol) ?? Number.MAX_SAFE_INTEGER;
          // Symbols not yet placed fall to the bottom, value-sorted.
          if (ia !== ib) return ia - ib;
          return b.marketValueKrw - a.marketValueKrw;
        });
        break;
      }
      default:
        list.sort((a, b) => a.unrealizedPnlRate - b.unrealizedPnlRate);
    }
    return list;
  }, [portfolio.holdings, sort, paperOrder]);

  // Biggest loser regardless of display sort — drives the "최대 낙폭" badge.
  const worstSymbol = useMemo(() => {
    let symbol: string | null = null;
    let worst = 0;
    for (const h of portfolio.holdings) {
      if (h.unrealizedPnlRate < worst) {
        worst = h.unrealizedPnlRate;
        symbol = h.symbol;
      }
    }
    return symbol;
  }, [portfolio.holdings]);
  const { summary } = portfolio;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // The sell picker defaults to the first (biggest-loss) holding until the user
  // explicitly chooses one — derived during render, so no effect/setState.
  const effectiveSellSymbol =
    sellSymbol && holdings.some((h) => h.symbol === sellSymbol)
      ? sellSymbol
      : (holdings[0]?.symbol ?? "");

  // Local catalog matches (instant, Korean-name aware) merged with the full
  // Yahoo symbol universe (debounced fetch). Catalog results rank first.
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const local = searchSymbols(q, 7);
    const seen = new Set(local.map((e) => e.symbol));
    const extra =
      remote.query === q
        ? remote.items.filter((e) => !seen.has(e.symbol))
        : [];
    return [...local, ...extra].slice(0, 10);
  }, [query, remote]);

  const remotePending =
    query.trim().length > 0 && remote.query !== query.trim();

  // Debounced free-text search across every KR/US symbol Yahoo knows about.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/symbol-search?q=${encodeURIComponent(q)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { results?: SymbolEntry[] };
        if (!cancelled && Array.isArray(data.results)) {
          setRemote({ query: q, items: data.results });
        }
      } catch {
        /* ignore — local catalog results are still shown */
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // ---- quote fetching ----
  const mergeQuotes = useCallback((incoming: Quote[]) => {
    setQuotes((prev) => {
      const m = new Map(prev.map((q) => [q.symbol, q]));
      for (const q of incoming) m.set(q.symbol, q);
      return [...m.values()];
    });
  }, []);

  const fetchQuotes = useCallback(
    async (symbols: string[]) => {
      if (symbols.length === 0) return;
      try {
        const res = await fetch(
          `/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          quotes: Quote[];
          fetchedAt: number;
        };
        if (Array.isArray(data.quotes) && data.quotes.length > 0) {
          mergeQuotes(data.quotes);
          setFetchedAt(data.fetchedAt ?? Date.now());
        }
      } catch {
        /* network blip — keep last known quotes */
      }
    },
    [mergeQuotes],
  );

  // Keep a ref of the latest quotes so async callbacks (fetch / refresh) can
  // read them without re-subscribing whenever the quote list changes.
  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  // Make sure every held / currently-targeted symbol has a quote loaded.
  useEffect(() => {
    const needed = new Set<string>();
    for (const t of trades) needed.add(t.symbol);
    if (selectedEntry) needed.add(selectedEntry.symbol);
    if (effectiveSellSymbol) needed.add(effectiveSellSymbol);
    const missing = [...needed].filter(
      (s) => !quotesRef.current.some((q) => q.symbol === s),
    );
    if (missing.length === 0) return;
    let cancelled = false;
    setLoadingQuote(true);
    fetchQuotes(missing).finally(() => {
      if (!cancelled) setLoadingQuote(false);
    });
    return () => {
      cancelled = true;
    };
  }, [trades, selectedEntry, effectiveSellSymbol, fetchQuotes]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchQuotes(quotesRef.current.map((q) => q.symbol));
    } finally {
      setRefreshing(false);
    }
  }, [fetchQuotes]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!id) id = setInterval(refresh, POLL_MS);
    };
    const stop = () => {
      if (id) {
        clearInterval(id);
        id = null;
      }
    };
    const onVisible = () => {
      if (document.hidden) {
        stop();
      } else {
        refresh();
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Close the search dropdown on outside click.
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // The symbol the form currently targets depends on the mode.
  const sellHolding =
    mode === "sell"
      ? (holdings.find((h) => h.symbol === effectiveSellSymbol) ?? null)
      : null;
  const activeSymbol =
    mode === "buy" ? selectedEntry?.symbol : effectiveSellSymbol || undefined;
  const activeMarket: Market =
    mode === "buy"
      ? (selectedEntry?.market ?? "US")
      : (sellHolding?.market ?? "US");
  const activeName =
    mode === "buy"
      ? selectedEntry
        ? displayName(selectedEntry)
        : ""
      : (sellHolding?.name ?? "");
  const activeQuote = activeSymbol ? quotesMap.get(activeSymbol) : undefined;
  const hasTarget = mode === "buy" ? !!selectedEntry : !!sellHolding;

  // Prefill the price input with the live price once per (mode, symbol).
  // Adjusting state during render (React's documented pattern) instead of in an
  // effect — a periodic quote refresh keeps the same key, so a manually entered
  // price is never clobbered; only switching symbol/mode re-prefills.
  const priceKey = `${mode}:${activeSymbol ?? ""}`;
  if (activeSymbol && activeQuote && priceKey !== prevPriceKey) {
    setPrevPriceKey(priceKey);
    setPriceInput(priceToInput(activeQuote.price, activeMarket));
  }

  // ---- trade actions ----
  const recordTrade = useCallback(
    (t: {
      symbol: string;
      market: Market;
      name: string;
      side: "BUY" | "SELL";
      quantity: number;
      price: number;
    }) => {
      if (t.quantity <= 0 || t.price <= 0) return;
      const trade: Trade = {
        id: `paper-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        market: t.market,
        symbol: t.symbol,
        name: t.name,
        side: t.side,
        quantity: t.quantity,
        price: t.price,
        exchangeRate: t.market === "US" ? usdKrw : 1,
        tradedAt: new Date().toISOString(),
      };
      setTrades((prev) => [...prev, trade]);
    },
    [usdKrw, setTrades],
  );

  const parsedQty = Math.max(1, Math.floor(Number(qtyInput) || 1));
  const parsedPrice = Number(priceInput) || 0;
  const fx = activeMarket === "US" ? usdKrw : 1;

  function submit() {
    if (parsedPrice <= 0) return;
    if (mode === "buy") {
      if (!selectedEntry) return;
      recordTrade({
        symbol: selectedEntry.symbol,
        market: selectedEntry.market,
        name: displayName(selectedEntry),
        side: "BUY",
        quantity: parsedQty,
        price: parsedPrice,
      });
    } else {
      if (!sellHolding) return;
      recordTrade({
        symbol: sellHolding.symbol,
        market: sellHolding.market,
        name: sellHolding.name,
        side: "SELL",
        quantity: Math.min(parsedQty, sellHolding.quantity),
        price: parsedPrice,
      });
    }
    setQtyInput("1");
  }

  /** Persist the manual holdings order after a drag (sort = "직접 설정"). */
  function handleHoldingsDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = holdings.map((h) => h.symbol);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from === -1 || to === -1) return;
    setPaperOrder(arrayMove(ids, from, to));
  }

  function pick(entry: SymbolEntry) {
    setSelectedEntry(entry);
    setQuery("");
    setOpen(false);
    setHighlight(0);
  }

  function onQueryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && results[highlight]) {
        e.preventDefault();
        pick(results[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function reset() {
    if (trades.length === 0) return;
    if (window.confirm("모의 투자 내역을 모두 초기화할까요? 되돌릴 수 없습니다.")) {
      setTrades([]);
      setSelectedEntry(null);
      setSellSymbol("");
    }
  }

  const onManualRefresh = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 1000) return;
    lastClickRef.current = now;
    refresh();
  };

  return (
    <div className="space-y-5">
      {/* 거래 입력 폼 */}
      <div className="space-y-2.5 rounded-xl bg-muted/40 p-3">
        <div className="flex gap-1">
          {(["buy", "sell"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
                mode === m
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground",
              )}
            >
              {m === "buy" ? "매수" : "매도"}
            </button>
          ))}
        </div>

        {/* 종목 선택 */}
        {mode === "buy" ? (
          <div ref={comboRef} className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setHighlight(0);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onQueryKeyDown}
              placeholder="종목명·티커 검색 (애플, AAPL, TQQQ)"
              className="pl-8"
            />
            {open && query.trim().length > 0 ? (
              <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg bg-popover py-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
                {results.length > 0 ? (
                  <ul>
                    {results.map((e, i) => (
                      <li key={`${e.market}:${e.symbol}`}>
                        <button
                          type="button"
                          onClick={() => pick(e)}
                          onMouseEnter={() => setHighlight(i)}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left",
                            i === highlight && "bg-accent",
                          )}
                        >
                          <MarketBadge market={e.market} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {displayName(e)}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {e.symbol}
                              {e.nameKo ? ` · ${e.name}` : ""}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : remotePending ? (
                  <p className="px-2.5 py-2 text-xs text-muted-foreground">
                    검색 중…
                  </p>
                ) : (
                  <p className="px-2.5 py-2 text-xs text-muted-foreground">
                    검색 결과가 없어요.
                  </p>
                )}
                {results.length > 0 && remotePending ? (
                  <p className="mt-1 border-t border-border px-2.5 pt-1.5 text-[11px] text-muted-foreground">
                    전체 종목에서 더 찾는 중…
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : holdings.length === 0 ? (
          <p className="py-1 text-xs text-muted-foreground">
            매도할 보유 종목이 없습니다.
          </p>
        ) : (
          <select
            value={effectiveSellSymbol}
            onChange={(e) => setSellSymbol(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {holdings.map((h) => (
              <option key={h.symbol} value={h.symbol}>
                {h.name} · {h.quantity}주 보유
              </option>
            ))}
          </select>
        )}

        {/* 체결가 · 수량 · 실행 */}
        {hasTarget ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <MarketBadge market={activeMarket} />
              <span className="truncate font-medium">{activeName}</span>
              <span className="text-xs text-muted-foreground">{activeSymbol}</span>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-28 flex-1 flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  체결가 · {activeMarket === "KR" ? "원" : "USD"}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="tabular"
                />
              </label>
              <label className="flex w-20 flex-col gap-1">
                <span className="text-xs text-muted-foreground">수량</span>
                <Input
                  type="number"
                  min={1}
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  className="tabular"
                />
              </label>
              <Button
                variant={mode === "sell" ? "destructive" : "default"}
                onClick={submit}
                disabled={parsedPrice <= 0}
              >
                {mode === "buy" ? "매수" : "매도"}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                현재가{" "}
                {loadingQuote && !activeQuote ? (
                  "불러오는 중…"
                ) : activeQuote ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPriceInput(
                        priceToInput(activeQuote.price, activeMarket),
                      )
                    }
                    className="tabular text-foreground underline-offset-2 hover:underline"
                  >
                    {formatLocal(activeMarket, activeQuote.price)}
                  </button>
                ) : (
                  "—"
                )}
              </span>
              <span>
                예상 금액{" "}
                <span className="tabular text-foreground">
                  {formatKrw(parsedPrice * parsedQty * fx)}
                </span>
              </span>
              {mode === "sell" && sellHolding ? (
                <span>보유 {sellHolding.quantity}주</span>
              ) : null}
            </div>
          </>
        ) : mode === "buy" ? (
          <p className="py-1 text-xs text-muted-foreground">
            종목을 검색해 선택하세요.
          </p>
        ) : null}
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat
          label="평가금액"
          value={formatKrw(summary.totalMarketValueKrw)}
        />
        <SummaryStat
          label="평가손익"
          value={formatSignedKrw(summary.totalUnrealizedPnlKrw)}
          valueClass={pnlClass(summary.totalUnrealizedPnlKrw)}
          sub={formatPercent(summary.totalUnrealizedPnlRate, { signed: true })}
          subClass={pnlClass(summary.totalUnrealizedPnlKrw)}
        />
        <SummaryStat
          label="실현손익"
          value={formatSignedKrw(summary.totalRealizedPnlKrw)}
          valueClass={pnlClass(summary.totalRealizedPnlKrw)}
        />
      </div>

      {/* 모의 보유 종목 */}
      {holdings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          아직 모의 보유 종목이 없어요.
          <br />
          위에서 종목을 검색해 매수해보세요.
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              모의 보유
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as PaperSort)}
              aria-label="정렬 순서"
              className="h-7 rounded-md border border-input bg-transparent pr-1 pl-2 text-xs text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="loss">손실 큰 순</option>
              <option value="gain">수익 큰 순</option>
              <option value="value">평가금액 순</option>
              <option value="quantity">보유 수량 순</option>
              <option value="name">이름순</option>
              <option value="custom">직접 설정</option>
            </select>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleHoldingsDragEnd}
          >
            <SortableContext
              items={holdings.map((h) => h.symbol)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-border">
                {holdings.map((h) => (
                  <SortableHoldingRow
                    key={`${h.market}:${h.symbol}`}
                    holding={h}
                    draggable={sort === "custom"}
                    isWorst={h.symbol === worstSymbol}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* 푸터 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          <span className="tabular" suppressHydrationWarning>
            {new Date(fetchedAt).toLocaleTimeString("ko-KR")}
          </span>{" "}
          기준 · 가상 거래 (실제 주문 아님)
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onManualRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            새로고침
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={trades.length === 0}
          >
            <RotateCcw className="size-3.5" />
            초기화
          </Button>
        </div>
      </div>
    </div>
  );
}

function MarketBadge({ market }: { market: Market }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {market}
    </span>
  );
}

function SortableHoldingRow({
  holding,
  draggable,
  isWorst,
}: {
  holding: Holding;
  draggable: boolean;
  isWorst: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: holding.symbol, disabled: !draggable });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 py-2.5",
        isDragging && "relative z-10 opacity-90",
      )}
    >
      {draggable ? (
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`${holding.name} 순서 이동`}
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" strokeWidth={2} />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{holding.name}</span>
          {isWorst ? (
            <Badge variant="destructive" className="shrink-0">
              최대 낙폭
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 tabular text-xs text-muted-foreground">
          {holding.quantity}주 · 평균{" "}
          {formatLocal(holding.market, holding.avgPrice)} →{" "}
          {formatLocal(holding.market, holding.currentPrice)}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="tabular text-sm font-medium">
          {formatKrw(holding.marketValueKrw)}
        </div>
        <div
          className={cn("tabular text-xs", pnlClass(holding.unrealizedPnlKrw))}
        >
          {formatSignedKrw(holding.unrealizedPnlKrw)} (
          {formatPercent(holding.unrealizedPnlRate, { signed: true })})
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  valueClass,
  sub,
  subClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
  subClass?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 tabular text-base font-semibold", valueClass)}>
        {value}
      </div>
      {sub ? <div className={cn("tabular text-xs", subClass)}>{sub}</div> : null}
    </div>
  );
}
