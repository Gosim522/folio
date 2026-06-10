import type { Quote, SymbolEntry } from "./types";

const BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

// Yahoo blocks requests with default fetch UA — present as a regular browser.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export type YahooMeta = {
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  currency?: string;
  exchangeName?: string;
  symbol?: string;
};

export type YahooChart = {
  meta: YahooMeta;
  /** Close prices, NaN filtered out. */
  closes: number[];
  /** Epoch seconds aligned with closes. */
  timestamps: number[];
};

/** Low-level fetch — returns chart meta + price series, or null on failure. */
export async function fetchYahooChart(
  yahooSymbol: string,
  opts: { range?: string; interval?: string } = {},
): Promise<YahooChart | null> {
  try {
    const range = opts.range ?? "2d";
    const interval = opts.interval ?? "1d";
    const url = `${BASE}/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: YahooMeta;
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }>;
      };
    };
    const result = json.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;
    const rawCloses = result?.indicators?.quote?.[0]?.close ?? [];
    const rawTimes = result?.timestamp ?? [];
    const closes: number[] = [];
    const timestamps: number[] = [];
    for (let i = 0; i < rawCloses.length; i++) {
      const v = rawCloses[i];
      if (typeof v === "number" && Number.isFinite(v)) {
        closes.push(v);
        timestamps.push(rawTimes[i] ?? 0);
      }
    }
    return { meta, closes, timestamps };
  } catch {
    return null;
  }
}

export async function fetchYahooMeta(yahooSymbol: string): Promise<YahooMeta | null> {
  const chart = await fetchYahooChart(yahooSymbol);
  return chart?.meta ?? null;
}

export async function fetchYahooQuote(entry: SymbolEntry): Promise<Quote | null> {
  const chart = await fetchYahooChart(entry.yahooSymbol);
  const meta = chart?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;

  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const changeAbs = price - prevClose;
  const changeRate = prevClose ? (changeAbs / prevClose) * 100 : 0;

  return {
    ...entry,
    currency: meta.currency ?? (entry.market === "KR" ? "KRW" : "USD"),
    price,
    previousClose: prevClose,
    dayHigh: meta.regularMarketDayHigh ?? price,
    dayLow: meta.regularMarketDayLow ?? price,
    volume: meta.regularMarketVolume ?? 0,
    changeAbs,
    changeRate,
    fetchedAt: Date.now(),
  };
}

export async function fetchManyYahooQuotes(entries: SymbolEntry[]): Promise<Quote[]> {
  const results = await Promise.all(entries.map(fetchYahooQuote));
  return results.filter((q): q is Quote => q !== null);
}
