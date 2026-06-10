"use client";

import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ECONOMIC_EVENTS,
  type EconomicEvent,
  type EventCountry,
  type EventImportance,
  type EventKind,
} from "@/lib/calendar/events";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<EventKind, string> = {
  macro: "매크로",
  policy: "정책",
  earnings: "실적",
  data: "지표",
};

const COUNTRY_FLAG: Record<EventCountry, string> = {
  KR: "🇰🇷",
  US: "🇺🇸",
  global: "🌐",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

type EnrichedEvent = EconomicEvent & { ms: number };

function startOfDayLocal(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayKey(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function relativeDayLabel(eventMs: number, nowMs: number) {
  const diffDays = Math.round(
    (startOfDayLocal(eventMs) - startOfDayLocal(nowMs)) / DAY_MS,
  );
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  if (diffDays === -1) return "어제";
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}일 후`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}일 전`;
  const d = new Date(eventMs);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatTime(ms: number) {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function EconomicCalendar() {
  const [now, setNow] = useState<number>(0);
  const [minImportance, setMinImportance] = useState<EventImportance>(3);
  const [view, setView] = useState<"list" | "calendar">("list");

  useEffect(() => {
    // SSR 무화화: 서버에서는 0, 마운트 후 클라이언트 시간으로 갱신 — hydration mismatch 회피.
    // 외부 시계 동기화 패턴이라 setState-in-effect 가 정당함 (useSyncExternalStore 대체 가능하나
    // 60s interval 의 단순성 때문에 이대로).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const allEvents = useMemo<EnrichedEvent[]>(() => {
    return ECONOMIC_EVENTS.map((e) => ({
      ...e,
      ms: new Date(e.date).getTime(),
    }))
      .filter((e) => e.importance >= minImportance)
      .sort((a, b) => a.ms - b.ms);
  }, [minImportance]);

  const listEvents = useMemo(() => {
    if (now === 0) return [];
    return allEvents.filter((e) => e.ms >= startOfDayLocal(now)).slice(0, 6);
  }, [allEvents, now]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>중요도</span>
          {([1, 3, 4, 5] as EventImportance[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setMinImportance(lvl)}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors",
                minImportance === lvl
                  ? "bg-muted text-foreground"
                  : "hover:text-foreground",
              )}
              aria-pressed={minImportance === lvl}
            >
              {lvl === 1 ? "전체" : `★${lvl}+`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 rounded-md bg-muted/60 p-0.5 text-xs">
          <ViewToggle current={view} value="list" onClick={() => setView("list")}>
            리스트
          </ViewToggle>
          <ViewToggle
            current={view}
            value="calendar"
            onClick={() => setView("calendar")}
          >
            달력
          </ViewToggle>
        </div>
      </div>

      {now === 0 ? (
        <div className="h-60" />
      ) : view === "list" ? (
        <ListView events={listEvents} now={now} />
      ) : (
        <CalendarView events={allEvents} now={now} />
      )}
    </div>
  );
}

function ViewToggle({
  current,
  value,
  onClick,
  children,
}: {
  current: string;
  value: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-0.5 transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function ListView({
  events,
  now,
}: {
  events: EnrichedEvent[];
  now: number;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
        예정된 일정 없음
      </div>
    );
  }
  return (
    <ul className="space-y-1.5">
      {events.map((e) => (
        <EventRow key={e.id} event={e} ms={e.ms} now={now} />
      ))}
    </ul>
  );
}

function CalendarView({
  events,
  now,
}: {
  events: EnrichedEvent[];
  now: number;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const anchor = useMemo(() => {
    const d = new Date(now);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now, monthOffset]);

  const cells = useMemo(() => {
    const firstDow = anchor.getDay();
    const gridStart = new Date(anchor);
    gridStart.setDate(anchor.getDate() - firstDow);

    const byDay = new Map<string, EnrichedEvent[]>();
    for (const e of events) {
      const key = dayKey(e.ms);
      const list = byDay.get(key) ?? [];
      list.push(e);
      byDay.set(key, list);
    }

    const out: Array<{
      date: Date;
      ms: number;
      key: string;
      isInMonth: boolean;
      events: EnrichedEvent[];
    }> = [];
    for (let i = 0; i < 42; i++) {
      const cur = new Date(gridStart);
      cur.setDate(gridStart.getDate() + i);
      const key = dayKey(cur.getTime());
      out.push({
        date: cur,
        ms: cur.getTime(),
        key,
        isInMonth: cur.getMonth() === anchor.getMonth(),
        events: byDay.get(key) ?? [],
      });
    }
    return out;
  }, [anchor, events]);

  const todayKey = dayKey(now);
  const effectiveSelectedKey = selectedDayKey ?? todayKey;
  const selectedCell = cells.find((c) => c.key === effectiveSelectedKey);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setMonthOffset((o) => o - 1);
            setSelectedDayKey(null);
          }}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="이전 달"
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} />
        </button>
        <div className="text-sm font-medium">
          {anchor.getFullYear()}년 {anchor.getMonth() + 1}월
        </div>
        <button
          type="button"
          onClick={() => {
            setMonthOffset((o) => o + 1);
            setSelectedDayKey(null);
          }}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="다음 달"
        >
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-0.5",
              i === 0 && "text-rose-400/80",
              i === 6 && "text-sky-400/80",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          const isSelected = cell.key === effectiveSelectedKey;
          const isToday = cell.key === todayKey;
          const hasEvents = cell.events.length > 0;
          const maxImportance = cell.events.reduce(
            (m, e) => Math.max(m, e.importance),
            0,
          );
          const tintBg = !hasEvents
            ? ""
            : maxImportance >= 5
              ? "bg-pos/15 hover:bg-pos/25"
              : maxImportance >= 4
                ? "bg-brand/15 hover:bg-brand/25"
                : "bg-muted/60 hover:bg-muted/80";
          const dotColor =
            maxImportance >= 5
              ? "bg-pos"
              : maxImportance >= 4
                ? "bg-brand"
                : "bg-muted-foreground/70";
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelectedDayKey(cell.key)}
              className={cn(
                "relative flex h-9 flex-col items-center justify-center gap-0.5 rounded-md border text-[11px] transition-colors",
                isSelected
                  ? "border-brand bg-brand/25 hover:bg-brand/30"
                  : cn(
                      "border-transparent",
                      hasEvents ? tintBg : "hover:bg-muted/40",
                    ),
                !cell.isInMonth && "opacity-40",
                isToday && !isSelected && "ring-1 ring-brand/50",
              )}
              aria-label={`${cell.date.getMonth() + 1}월 ${cell.date.getDate()}일${hasEvents ? ` · ${cell.events.length}개 일정` : ""}`}
            >
              <span
                className={cn(
                  "tabular leading-none",
                  isToday
                    ? "font-bold text-brand"
                    : hasEvents
                      ? "font-semibold text-foreground"
                      : "text-foreground/80",
                )}
              >
                {cell.date.getDate()}
              </span>
              {hasEvents ? (
                <span className="flex items-center gap-[2px]">
                  {cell.events.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={cn("size-1.5 rounded-full", dotColor)}
                    />
                  ))}
                  {cell.events.length > 3 ? (
                    <span className="text-[8px] tabular text-muted-foreground">
                      +{cell.events.length - 3}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedCell && selectedCell.events.length > 0 ? (
        <div className="space-y-1.5 border-t border-border/60 pt-2">
          <div className="px-1 text-[11px] font-medium text-muted-foreground">
            {selectedCell.date.getMonth() + 1}월 {selectedCell.date.getDate()}일
            <span className="ml-1.5 text-muted-foreground/60">
              {selectedCell.events.length}개
            </span>
          </div>
          <ul className="space-y-1.5">
            {selectedCell.events.map((e) => (
              <EventRow key={e.id} event={e} ms={e.ms} now={now} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ImportanceStars({ level }: { level: EventImportance }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`중요도 ${level}/5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3",
            i < level
              ? "fill-pos text-pos"
              : "fill-transparent text-muted-foreground/40",
          )}
          strokeWidth={1.6}
        />
      ))}
    </span>
  );
}

function EventRow({
  event,
  ms,
  now,
}: {
  event: EconomicEvent;
  ms: number;
  now: number;
}) {
  const dayLabel = relativeDayLabel(ms, now);
  const isImminent = dayLabel === "오늘" || dayLabel === "내일";

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-2.5 transition-colors",
        isImminent && "border-brand/40 bg-brand/5",
      )}
    >
      <div className="flex w-16 shrink-0 flex-col items-start">
        <span
          className={cn(
            "text-[11px] font-medium",
            isImminent ? "text-brand" : "text-muted-foreground",
          )}
        >
          {dayLabel}
        </span>
        <span className="tabular text-[11px] text-muted-foreground">
          {formatTime(ms)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span aria-hidden className="text-xs">
            {COUNTRY_FLAG[event.country]}
          </span>
          <span className="truncate">{event.title}</span>
        </div>
        {event.note ? (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {event.note}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <ImportanceStars level={event.importance} />
        <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {KIND_LABEL[event.kind]}
        </span>
      </div>
    </li>
  );
}
