"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteRow } from "./quote-row";
import { activeBroker, type BrokerDef } from "@/lib/brokers";
import type { Market, Quote } from "@/lib/quotes/types";
import { cn } from "@/lib/utils";

const POLL_MS = 15_000;

const SECTIONS: { market: Market; label: string }[] = [
  { market: "KR", label: "국내" },
  { market: "US", label: "해외" },
];

type Props = {
  initialQuotes: Quote[];
  initialFetchedAt: number;
};

export function QuoteList({ initialQuotes, initialFetchedAt }: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [fetchedAt, setFetchedAt] = useState(initialFetchedAt);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<BrokerDef | null>(null);
  const lastClickRef = useRef(0);

  // Resolve the active quote source (broker priority → Yahoo fallback).
  // Re-checks when broker API keys change in this or another tab.
  useEffect(() => {
    const resolve = () => setSource(activeBroker());
    resolve();
    window.addEventListener("preferences:change", resolve);
    window.addEventListener("storage", resolve);
    return () => {
      window.removeEventListener("preferences:change", resolve);
      window.removeEventListener("storage", resolve);
    };
  }, []);

  const grouped = useMemo(() => {
    const map: Record<Market, Quote[]> = { KR: [], US: [] };
    for (const q of quotes) map[q.market].push(q);
    return map;
  }, [quotes]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { quotes: Quote[]; fetchedAt: number };
      if (Array.isArray(data.quotes) && data.quotes.length > 0) {
        setQuotes(data.quotes);
        setFetchedAt(data.fetchedAt);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(refresh, POLL_MS);
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

  const onManualClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 1000) return;
    lastClickRef.current = now;
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          마지막 업데이트{" "}
          <span className="tabular text-foreground" suppressHydrationWarning>
            {new Date(fetchedAt).toLocaleTimeString("ko-KR")}
          </span>{" "}
          · {POLL_MS / 1000}초마다 자동 갱신 · 시세 출처{" "}
          <span className="text-foreground">
            {source
              ? source.implemented
                ? source.shortLabel
                : `${source.shortLabel} (연동 준비 중)`
              : "Yahoo"}
          </span>
        </p>
        <Button variant="outline" size="sm" onClick={onManualClick} disabled={refreshing}>
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          새로고침
        </Button>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          시세를 가져오지 못했습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.
        </div>
      ) : (
        SECTIONS.map(({ market, label }) => {
          const list = grouped[market];
          if (list.length === 0) return null;
          return (
            <section key={market} className="space-y-2.5">
              <div className="flex items-baseline gap-2 px-1">
                <h3 className="text-sm font-semibold tracking-tight">{label}</h3>
                <span className="text-xs text-muted-foreground">{list.length}</span>
              </div>
              <Card>
                <CardContent className="p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {list.map((q) => (
                      <QuoteRow key={q.yahooSymbol} quote={q} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          );
        })
      )}
    </div>
  );
}
