export type EventCountry = "KR" | "US" | "global";
export type EventKind = "macro" | "policy" | "earnings" | "data";
export type EventImportance = 1 | 2 | 3 | 4 | 5;

export type EconomicEvent = {
  id: string;
  /** ISO datetime. Times stored in event's source timezone where relevant. */
  date: string;
  title: string;
  importance: EventImportance;
  country: EventCountry;
  kind: EventKind;
  note?: string;
};

/**
 * Curated upcoming events. Hand-maintained for now; ideal replacement is a
 * proper economic calendar API (Investing.com, ForexFactory) once available.
 */
export const ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: "us-cpi-2026-05",
    date: "2026-05-22T21:30:00+09:00",
    title: "미국 5월 CPI",
    importance: 5,
    country: "US",
    kind: "data",
    note: "예상 3.1% YoY",
  },
  {
    id: "kr-export-may-prelim",
    date: "2026-05-22T09:00:00+09:00",
    title: "한국 5월 수출 잠정치",
    importance: 3,
    country: "KR",
    kind: "data",
  },
  {
    id: "nvda-earnings-q1-2026",
    date: "2026-05-28T06:00:00+09:00",
    title: "NVIDIA 1분기 실적",
    importance: 4,
    country: "US",
    kind: "earnings",
  },
  {
    id: "us-nfp-2026-06",
    date: "2026-06-05T21:30:00+09:00",
    title: "미국 6월 비농업고용",
    importance: 4,
    country: "US",
    kind: "data",
  },
  {
    id: "kr-mpc-2026-06",
    date: "2026-06-12T10:00:00+09:00",
    title: "한국은행 금통위 (기준금리 결정)",
    importance: 4,
    country: "KR",
    kind: "policy",
  },
  {
    id: "us-cpi-2026-06",
    date: "2026-06-12T21:30:00+09:00",
    title: "미국 6월 CPI",
    importance: 5,
    country: "US",
    kind: "data",
  },
  {
    id: "fomc-2026-06",
    date: "2026-06-18T03:00:00+09:00",
    title: "FOMC 금리 결정",
    importance: 5,
    country: "US",
    kind: "policy",
    note: "파월 의장 기자회견 03:30 KST",
  },
  {
    id: "samsung-earnings-q2-2026",
    date: "2026-07-08T08:00:00+09:00",
    title: "삼성전자 2분기 잠정 실적",
    importance: 4,
    country: "KR",
    kind: "earnings",
  },
  {
    id: "us-cpi-2026-07",
    date: "2026-07-15T21:30:00+09:00",
    title: "미국 7월 CPI",
    importance: 5,
    country: "US",
    kind: "data",
  },
  {
    id: "kr-mpc-2026-07",
    date: "2026-07-17T10:00:00+09:00",
    title: "한국은행 금통위",
    importance: 4,
    country: "KR",
    kind: "policy",
  },
  {
    id: "aapl-earnings-q3-2026",
    date: "2026-07-30T06:00:00+09:00",
    title: "Apple 3분기 실적",
    importance: 4,
    country: "US",
    kind: "earnings",
  },
  {
    id: "fomc-2026-07",
    date: "2026-07-30T03:00:00+09:00",
    title: "FOMC 금리 결정",
    importance: 5,
    country: "US",
    kind: "policy",
  },
];
