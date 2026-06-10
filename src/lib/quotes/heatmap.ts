import { fetchYahooMeta } from "./yahoo";

export type HeatmapStock = {
  symbol: string;
  name: string;
  sector: string;
  /** Approximate market cap in USD billions — drives treemap cell size. */
  marketCapB: number;
  price: number;
  changeRate: number;
};

export type HeatmapSector = {
  sector: string;
  stocks: HeatmapStock[];
  marketCapB: number;
  /** Market-cap-weighted average change rate across child stocks. */
  weightedChangeRate: number;
};

/** Curated S&P 500 components grouped by sector. Market caps are approximate. */
const HEATMAP_SEED: Array<Omit<HeatmapStock, "price" | "changeRate">> = [
  // Technology
  { symbol: "MSFT", name: "Microsoft", sector: "Technology", marketCapB: 3200 },
  { symbol: "AAPL", name: "Apple", sector: "Technology", marketCapB: 3500 },
  { symbol: "NVDA", name: "NVIDIA", sector: "Technology", marketCapB: 3100 },
  { symbol: "AVGO", name: "Broadcom", sector: "Technology", marketCapB: 800 },
  { symbol: "ORCL", name: "Oracle", sector: "Technology", marketCapB: 450 },
  { symbol: "AMD", name: "AMD", sector: "Technology", marketCapB: 280 },
  { symbol: "CRM", name: "Salesforce", sector: "Technology", marketCapB: 280 },
  // Communication
  { symbol: "GOOGL", name: "Alphabet", sector: "Communication", marketCapB: 2200 },
  { symbol: "META", name: "Meta", sector: "Communication", marketCapB: 1600 },
  { symbol: "NFLX", name: "Netflix", sector: "Communication", marketCapB: 280 },
  { symbol: "DIS", name: "Disney", sector: "Communication", marketCapB: 200 },
  { symbol: "T", name: "AT&T", sector: "Communication", marketCapB: 130 },
  // Consumer Cyclical
  { symbol: "AMZN", name: "Amazon", sector: "Consumer Cyclical", marketCapB: 2000 },
  { symbol: "TSLA", name: "Tesla", sector: "Consumer Cyclical", marketCapB: 800 },
  { symbol: "HD", name: "Home Depot", sector: "Consumer Cyclical", marketCapB: 400 },
  { symbol: "MCD", name: "McDonald's", sector: "Consumer Cyclical", marketCapB: 220 },
  { symbol: "NKE", name: "Nike", sector: "Consumer Cyclical", marketCapB: 130 },
  // Consumer Defensive
  { symbol: "WMT", name: "Walmart", sector: "Consumer Defensive", marketCapB: 600 },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer Defensive", marketCapB: 380 },
  { symbol: "COST", name: "Costco", sector: "Consumer Defensive", marketCapB: 380 },
  { symbol: "KO", name: "Coca-Cola", sector: "Consumer Defensive", marketCapB: 290 },
  { symbol: "PEP", name: "PepsiCo", sector: "Consumer Defensive", marketCapB: 230 },
  // Financial
  { symbol: "BRK-B", name: "Berkshire", sector: "Financial", marketCapB: 900 },
  { symbol: "JPM", name: "JPMorgan", sector: "Financial", marketCapB: 600 },
  { symbol: "V", name: "Visa", sector: "Financial", marketCapB: 530 },
  { symbol: "MA", name: "Mastercard", sector: "Financial", marketCapB: 450 },
  { symbol: "BAC", name: "Bank of America", sector: "Financial", marketCapB: 320 },
  // Healthcare
  { symbol: "LLY", name: "Eli Lilly", sector: "Healthcare", marketCapB: 720 },
  { symbol: "UNH", name: "UnitedHealth", sector: "Healthcare", marketCapB: 510 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", marketCapB: 380 },
  { symbol: "ABBV", name: "AbbVie", sector: "Healthcare", marketCapB: 300 },
  { symbol: "MRK", name: "Merck", sector: "Healthcare", marketCapB: 250 },
  // Industrials
  { symbol: "GE", name: "GE", sector: "Industrials", marketCapB: 200 },
  { symbol: "CAT", name: "Caterpillar", sector: "Industrials", marketCapB: 180 },
  { symbol: "BA", name: "Boeing", sector: "Industrials", marketCapB: 130 },
  // Energy
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", marketCapB: 470 },
  { symbol: "CVX", name: "Chevron", sector: "Energy", marketCapB: 300 },
];

const BATCH_SIZE = 8;

async function fetchInBatches<T, R>(
  items: T[],
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

type CacheEntry = { data: HeatmapSector[]; expires: number };
let cache: CacheEntry | null = null;
// 5 min — treemap doesn't need second-level freshness, and this keeps the
// 60s page auto-refresh from re-fetching ~37 symbols every minute.
const TTL_MS = 5 * 60_000;

export async function fetchHeatmap(): Promise<HeatmapSector[]> {
  const now = Date.now();
  if (cache && cache.expires > now && cache.data.length > 0) return cache.data;

  const enriched = await fetchInBatches(HEATMAP_SEED, async (s) => {
    const meta = await fetchYahooMeta(s.symbol);
    if (!meta || typeof meta.regularMarketPrice !== "number") return null;
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const changeRate = prev ? ((price - prev) / prev) * 100 : 0;
    return { ...s, price, changeRate } satisfies HeatmapStock;
  });

  const stocks = enriched.filter((s): s is HeatmapStock => s !== null);

  const bySector = new Map<string, HeatmapStock[]>();
  for (const stock of stocks) {
    const arr = bySector.get(stock.sector) ?? [];
    arr.push(stock);
    bySector.set(stock.sector, arr);
  }
  const sectors: HeatmapSector[] = Array.from(bySector.entries())
    .map(([sector, list]) => {
      const marketCapB = list.reduce((acc, s) => acc + s.marketCapB, 0);
      const weighted =
        marketCapB > 0
          ? list.reduce((acc, s) => acc + s.changeRate * s.marketCapB, 0) / marketCapB
          : 0;
      return {
        sector,
        stocks: list.sort((a, b) => b.marketCapB - a.marketCapB),
        marketCapB,
        weightedChangeRate: weighted,
      };
    })
    .sort((a, b) => b.marketCapB - a.marketCapB);

  // Only cache non-empty results so a transient Yahoo blip doesn't freeze the panel.
  if (sectors.length > 0) {
    cache = { data: sectors, expires: now + TTL_MS };
  }
  return sectors;
}
