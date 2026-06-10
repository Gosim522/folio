"use client";

import { Bell, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreference } from "@/hooks/use-preferences";
import {
  newAlertId,
  type AlertDirection,
  type PriceAlert,
} from "@/lib/alerts/types";
import { PREF_KEYS } from "@/lib/preferences";
import { searchSymbols } from "@/lib/quotes/symbols";
import type { SymbolEntry } from "@/lib/quotes/types";
import { cn } from "@/lib/utils";

/*
  설정 Sheet 의 "가격 알림" 섹션. 알림 추가/목록/삭제. PriceAlertWatcher 가 폴링·발동을
  맡고, 여기서는 데이터 관리만.
*/

export function PriceAlertsPanel() {
  const [alerts, setAlerts] = usePreference<PriceAlert[]>(
    PREF_KEYS.priceAlerts,
    [],
  );
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<SymbolEntry | null>(null);
  const [direction, setDirection] = useState<AlertDirection>("above");
  const [target, setTarget] = useState("");

  const matches = useMemo(
    () => (query.length === 0 ? [] : searchSymbols(query, 5)),
    [query],
  );

  const reset = () => {
    setQuery("");
    setPicked(null);
    setTarget("");
  };

  const add = () => {
    if (!picked) return;
    const n = Number(target);
    if (!Number.isFinite(n) || n <= 0) return;
    const a: PriceAlert = {
      id: newAlertId(),
      symbol: picked.symbol,
      name: picked.name,
      market: picked.market,
      direction,
      targetPrice: n,
      createdAt: new Date().toISOString(),
    };
    setAlerts([a, ...alerts]);
    reset();
  };

  const remove = (id: string) => setAlerts(alerts.filter((a) => a.id !== id));

  const clear = (id: string) =>
    setAlerts(
      alerts.map((a) => (a.id === id ? { ...a, triggeredAt: undefined } : a)),
    );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card/40 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground/80">
          <Bell className="size-3.5" strokeWidth={2} />
          새 알림
        </div>
        <div className="space-y-2">
          {picked ? (
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm">
              <span>
                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                  {picked.market}
                </span>
                <span className="ml-2 font-medium">{picked.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                변경
              </button>
            </div>
          ) : (
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="종목 검색"
              />
              {matches.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-floating">
                  {matches.map((m) => (
                    <li key={`${m.market}:${m.symbol}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setPicked(m);
                          setQuery("");
                        }}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span>
                          <span className="text-[10px] font-medium uppercase text-muted-foreground">
                            {m.market}
                          </span>
                          <span className="ml-2">{m.name}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.symbol}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-0.5">
              {(["above", "below"] as AlertDirection[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={cn(
                    "rounded text-xs font-medium transition-colors",
                    direction === d
                      ? d === "above"
                        ? "bg-pos-soft text-pos"
                        : "bg-neg-soft text-neg"
                      : "text-muted-foreground",
                  )}
                >
                  {d === "above" ? "↑ 상회" : "↓ 하회"}
                </button>
              ))}
            </div>
            <Input
              type="number"
              step="any"
              min="0"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={`목표 (${picked?.market === "US" ? "USD" : "원"})`}
            />
            <Button onClick={add} disabled={!picked || !target}>
              <Plus className="size-3.5" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <ul className="space-y-1.5">
          {alerts.map((a) => {
            const above = a.direction === "above";
            const triggered = !!a.triggeredAt;
            return (
              <li
                key={a.id}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-lg border border-border p-2.5",
                  triggered ? "bg-muted/40" : "bg-card/40",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                      {a.market}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {a.name}
                    </span>
                    {triggered && (
                      <span className="rounded-full bg-pos-soft px-1.5 py-0.5 text-[10px] font-medium text-pos">
                        발동됨
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 text-xs tabular",
                      above ? "text-pos" : "text-neg",
                    )}
                  >
                    {above ? "↑" : "↓"}{" "}
                    {a.targetPrice.toLocaleString("ko-KR")}{" "}
                    {a.market === "KR" ? "원" : "$"}
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                  {triggered && (
                    <button
                      type="button"
                      onClick={() => clear(a.id)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="다시 활성화"
                    >
                      재설정
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    aria-label="삭제"
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-neg"
                  >
                    <Trash2 className="size-3.5" strokeWidth={2} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
