"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type MarketStatus = {
  label: string;
  /** "open" | "closed" — drives the dot color. */
  state: "open" | "closed";
  /** Local time string in the market's timezone. */
  localTime: string;
  /** Free-form note like "마감까지 2시간 30분" or "다음 개장: 월 09:00". */
  detail: string;
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function fmtHM(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}분`;
  if (minutes <= 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

/**
 * Compute market status for a given timezone-aware schedule (open/close in
 * the market's local timezone, Mon-Fri).
 */
function computeStatus(
  now: Date,
  timeZone: string,
  openHour: number,
  openMin: number,
  closeHour: number,
  closeMin: number,
): MarketStatus {
  // Use Intl.DateTimeFormat to read the wall-clock time in the market's tz.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday"); // "Mon".."Sun"
  const hour = parseInt(get("hour"), 10);
  const minute = parseInt(get("minute"), 10);

  const localTime = `${pad2(hour)}:${pad2(minute)}`;
  const nowMin = hour * 60 + minute;
  const openMinTotal = openHour * 60 + openMin;
  const closeMinTotal = closeHour * 60 + closeMin;

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const wd = dayMap[weekday] ?? 1;
  const isWeekday = wd >= 1 && wd <= 5;

  if (isWeekday && nowMin >= openMinTotal && nowMin < closeMinTotal) {
    const remaining = closeMinTotal - nowMin;
    return {
      label: "장 중",
      state: "open",
      localTime,
      detail: `마감까지 ${fmtHM(remaining)}`,
    };
  }

  // closed: compute next open
  let daysAhead = 0;
  if (isWeekday && nowMin < openMinTotal) {
    daysAhead = 0;
  } else {
    // jump to next weekday morning
    let probe = wd;
    let added = 0;
    while (true) {
      probe = (probe + 1) % 7;
      added += 1;
      if (probe >= 1 && probe <= 5) break;
      if (added > 7) break;
    }
    daysAhead = added;
  }

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const nextDay = (wd + daysAhead) % 7;
  const dayLabel = daysAhead === 0 ? "오늘" : daysAhead === 1 ? "내일" : dayNames[nextDay];
  const openLabel = `${pad2(openHour)}:${pad2(openMin)}`;

  return {
    label: isWeekday && nowMin >= closeMinTotal ? "장 마감" : "휴장",
    state: "closed",
    localTime,
    detail: `다음 개장 ${dayLabel} ${openLabel}`,
  };
}

export function MarketClock() {
  // Initialize to null on both server and client to avoid hydration mismatch,
  // then set after mount. 60s interval (down from 30s) is plenty for clock UX
  // and reduces re-renders that can disrupt an in-progress drag.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // 시계는 외부 시간 소스로부터 초기화 — hydration mismatch 회피 위해 마운트 후 첫 set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-[88px]" aria-hidden />;
  }

  const kr = computeStatus(now, "Asia/Seoul", 9, 0, 15, 30);
  const us = computeStatus(now, "America/New_York", 9, 30, 16, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MarketCell flag="🇰🇷" name="한국 (KRX)" status={kr} />
      <MarketCell flag="🇺🇸" name="미국 (NYSE/NASDAQ)" status={us} />
    </div>
  );
}

function MarketCell({
  flag,
  name,
  status,
}: {
  flag: string;
  name: string;
  status: MarketStatus;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden>{flag}</span>
          <span className="truncate">{name}</span>
        </div>
        <div className="mt-1 tabular text-lg font-semibold">{status.localTime}</div>
        <div className="text-xs text-muted-foreground">{status.detail}</div>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
          status.state === "open"
            ? "bg-pos-soft text-pos ring-pos/30"
            : "bg-muted text-muted-foreground ring-border",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            status.state === "open" ? "bg-pos" : "bg-muted-foreground/60",
          )}
        />
        {status.label}
      </span>
    </div>
  );
}
