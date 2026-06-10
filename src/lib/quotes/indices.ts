import { fetchYahooChart } from "./yahoo";

export type StripIndex = {
  key: string;
  yahooSymbol: string;
  name: string;
  price: number;
  changeAbs: number;
  changeRate: number;
  /** Normalized close-price series for sparkline (last ~5 trading days). */
  series: number[];
};

/** Market summary strip — Toss-home style. */
export const STRIP_SYMBOLS = [
  { key: "USDKRW", yahooSymbol: "KRW=X", name: "달러 환율" },
  { key: "NASDAQ", yahooSymbol: "^IXIC", name: "나스닥" },
  { key: "SP500", yahooSymbol: "^GSPC", name: "S&P 500" },
  { key: "KOSPI", yahooSymbol: "^KS11", name: "코스피" },
  { key: "KOSDAQ", yahooSymbol: "^KQ11", name: "코스닥" },
] as const;

export async function fetchMarketStrip(): Promise<StripIndex[]> {
  const results = await Promise.all(
    STRIP_SYMBOLS.map(async (s) => {
      const chart = await fetchYahooChart(s.yahooSymbol, { range: "5d", interval: "1d" });
      const meta = chart?.meta;
      if (!meta || typeof meta.regularMarketPrice !== "number") return null;
      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const changeAbs = price - prev;
      const changeRate = prev ? (changeAbs / prev) * 100 : 0;
      return {
        key: s.key,
        yahooSymbol: s.yahooSymbol,
        name: s.name,
        price,
        changeAbs,
        changeRate,
        series: chart!.closes,
      } satisfies StripIndex;
    }),
  );
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}
