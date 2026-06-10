export type Market = "KR" | "US";

export type SymbolEntry = {
  /** Internal canonical symbol — 6-digit KR code or US ticker. */
  symbol: string;
  /** Yahoo Finance compatible symbol — e.g. "005930.KS", "AAPL". */
  yahooSymbol: string;
  name: string;
  market: Market;
  /** Korean display/search name — e.g. "애플" for AAPL. */
  nameKo?: string;
  /** Extra search keywords — English/Korean aliases, sector nicknames. */
  aliases?: string[];
};

export type Quote = SymbolEntry & {
  currency: string;
  price: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  changeAbs: number;
  changeRate: number;
  /** Epoch ms when this quote was fetched. */
  fetchedAt: number;
};
