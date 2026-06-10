import { fetchYahooChart } from "./yahoo";

export type SectorPeriod = "d1" | "w1" | "m1" | "m3" | "y1";

export const SECTOR_PERIOD_LABEL: Record<SectorPeriod, string> = {
  d1: "1일",
  w1: "1주",
  m1: "1개월",
  m3: "3개월",
  y1: "1년",
};

export type SectorReturn = {
  symbol: string;
  /** Korean label */
  name: string;
  nameEn: string;
  d1: number;
  w1: number;
  m1: number;
  m3: number;
  y1: number;
};

const SECTORS: ReadonlyArray<{
  symbol: string;
  name: string;
  nameEn: string;
}> = [
  { symbol: "XLK", name: "테크", nameEn: "Technology" },
  { symbol: "XLC", name: "커뮤니케이션", nameEn: "Communication" },
  { symbol: "XLY", name: "경기 소비재", nameEn: "Consumer Cyclical" },
  { symbol: "XLP", name: "필수 소비재", nameEn: "Consumer Defensive" },
  { symbol: "XLF", name: "금융", nameEn: "Financial" },
  { symbol: "XLV", name: "헬스케어", nameEn: "Healthcare" },
  { symbol: "XLI", name: "산업재", nameEn: "Industrials" },
  { symbol: "XLE", name: "에너지", nameEn: "Energy" },
  { symbol: "XLU", name: "유틸리티", nameEn: "Utilities" },
  { symbol: "XLB", name: "원자재", nameEn: "Materials" },
  { symbol: "XLRE", name: "리츠", nameEn: "Real Estate" },
];

function pct(prev: number, curr: number) {
  if (!prev || !Number.isFinite(prev)) return 0;
  return ((curr - prev) / prev) * 100;
}

async function fetchSingleSector(symbol: string) {
  // One pull of 1y daily closes is enough to compute every supported period.
  const chart = await fetchYahooChart(symbol, { range: "1y", interval: "1d" });
  if (!chart || chart.closes.length < 2) return null;
  const closes = chart.closes;
  const last = closes[closes.length - 1];
  const closeAt = (offset: number) => {
    const idx = closes.length - 1 - offset;
    return idx >= 0 ? closes[idx] : closes[0];
  };
  return {
    d1: pct(closeAt(1), last),
    w1: pct(closeAt(5), last),
    m1: pct(closeAt(22), last),
    m3: pct(closeAt(66), last),
    y1: pct(closes[0], last),
  };
}

const BATCH_SIZE = 4;
async function fetchInBatches<T, R>(
  items: ReadonlyArray<T>,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const settled = await Promise.all(batch.map(fn));
    results.push(...settled);
  }
  return results;
}

const TTL_MS = 5 * 60_000;
type CacheEntry = { data: SectorReturn[]; expires: number };
let cache: CacheEntry | null = null;

export async function fetchSectorPerformance(): Promise<SectorReturn[]> {
  const now = Date.now();
  if (cache && cache.expires > now && cache.data.length > 0) return cache.data;

  const enriched = await fetchInBatches(SECTORS, async (s) => {
    const returns = await fetchSingleSector(s.symbol);
    if (!returns) return null;
    return {
      symbol: s.symbol,
      name: s.name,
      nameEn: s.nameEn,
      ...returns,
    } satisfies SectorReturn;
  });
  const out = enriched.filter((s): s is SectorReturn => s !== null);
  if (out.length > 0) cache = { data: out, expires: now + TTL_MS };
  return out;
}
