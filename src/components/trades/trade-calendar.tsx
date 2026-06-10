"use client";

import { useMemo } from "react";
import type { EnrichedTrade } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 53;
const DAYS = 7;

function startOfDayKst(d: Date) {
  // KST is UTC+9, no DST. Snap to that day's midnight in KST.
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const kst = utc + 9 * 60 * 60_000;
  const day = Math.floor(kst / DAY_MS);
  return day * DAY_MS - 9 * 60 * 60_000 - d.getTimezoneOffset() * 60_000;
}

function dateKey(ms: number) {
  const d = new Date(ms + 9 * 60 * 60_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function TradeCalendar({ trades }: { trades: EnrichedTrade[] }) {
  const { cells, monthLabels, maxCount, totalDays } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of trades) {
      const ms = startOfDayKst(new Date(t.tradedAt));
      const key = dateKey(ms);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const todayMs = startOfDayKst(new Date());
    // End on Saturday of the current week so columns align.
    const todayDate = new Date(todayMs + 9 * 60 * 60_000);
    const todayDow = todayDate.getUTCDay(); // 0=Sun..6=Sat
    const endMs = todayMs + (6 - todayDow) * DAY_MS;
    const startMs = endMs - (WEEKS * DAYS - 1) * DAY_MS;

    let max = 0;
    const cellList: Array<{
      week: number;
      day: number;
      count: number;
      ms: number;
      inFuture: boolean;
    }> = [];
    for (let i = 0; i < WEEKS * DAYS; i++) {
      const ms = startMs + i * DAY_MS;
      const week = Math.floor(i / DAYS);
      const day = i % DAYS;
      const key = dateKey(ms);
      const count = counts.get(key) ?? 0;
      if (count > max) max = count;
      cellList.push({ week, day, count, ms, inFuture: ms > todayMs });
    }

    // Compute month labels: for each week column, show month label if it's the
    // first week containing day-1 of a month.
    const labels: Array<{ week: number; label: string }> = [];
    let lastMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      const firstCellMs = startMs + w * DAYS * DAY_MS;
      const d = new Date(firstCellMs + 9 * 60 * 60_000);
      const month = d.getUTCMonth();
      if (month !== lastMonth) {
        labels.push({ week: w, label: `${month + 1}월` });
        lastMonth = month;
      }
    }

    return {
      cells: cellList,
      monthLabels: labels,
      maxCount: max,
      totalDays: trades.length === 0 ? 0 : cellList.filter((c) => c.count > 0).length,
    };
  }, [trades]);

  function intensityClass(count: number, inFuture: boolean) {
    if (inFuture) return "bg-transparent";
    if (count === 0) return "bg-muted/40";
    if (maxCount <= 1) return "bg-brand/80";
    const ratio = count / maxCount;
    if (ratio >= 0.75) return "bg-brand";
    if (ratio >= 0.5) return "bg-brand/80";
    if (ratio >= 0.25) return "bg-brand/55";
    return "bg-brand/30";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          1년간 거래 {trades.length}회 · 활동일 {totalDays}일
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px]">적음</span>
          <span className="size-2.5 rounded-sm bg-muted/40" />
          <span className="size-2.5 rounded-sm bg-brand/30" />
          <span className="size-2.5 rounded-sm bg-brand/55" />
          <span className="size-2.5 rounded-sm bg-brand/80" />
          <span className="size-2.5 rounded-sm bg-brand" />
          <span className="text-[11px]">많음</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          <div
            className="grid h-3 text-[10px] text-muted-foreground"
            style={{
              gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
              gap: "2px",
            }}
          >
            {Array.from({ length: WEEKS }).map((_, w) => {
              const lbl = monthLabels.find((m) => m.week === w);
              return (
                <div key={w} className="leading-none">
                  {lbl ? lbl.label : ""}
                </div>
              );
            })}
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${DAYS}, minmax(0, 1fr))`,
              gridAutoFlow: "column",
              gap: "2px",
            }}
          >
            {cells.map((c) => (
              <div
                key={`${c.week}-${c.day}`}
                title={`${dateKey(c.ms)} · ${c.count}회`}
                className={cn(
                  "size-2.5 rounded-sm transition-colors",
                  intensityClass(c.count, c.inFuture),
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
