import type { BrokerId } from "@/lib/brokers";
import type { Market } from "@/lib/quotes/types";

export type Side = "BUY" | "SELL";

export type Trade = {
  id: string;
  market: Market;
  symbol: string;
  name: string;
  side: Side;
  quantity: number;
  /** Price per share in market currency (KRW for KR, USD for US). */
  price: number;
  /** KRW per market-currency unit at trade time. 1 for KR. */
  exchangeRate: number;
  /** ISO datetime, KST timezone. */
  tradedAt: string;
  /** Broker account this trade belongs to. Unset for paper-trading sandbox trades. */
  account?: BrokerId;
  /** Fee in market currency. */
  fee?: number;
  /** Tax in market currency. */
  tax?: number;
  note?: string;
};

/** Same shape + per-sell enrichments computed by buildPortfolio. */
export type EnrichedTrade = Trade & {
  /** Moving-average price right after this trade. Market currency. */
  avgPriceAfter: number;
  /** Cumulative qty right after this trade. */
  quantityAfter: number;
  /** For SELL trades: realized PnL in market currency. */
  realizedPnl?: number;
  /** For SELL trades: realized PnL in KRW. */
  realizedPnlKrw?: number;
};

export type Holding = {
  symbol: string;
  market: Market;
  name: string;
  currency: string;
  quantity: number;
  avgPrice: number;
  /** Cost-basis-weighted average exchange rate. 1 for KR. */
  avgExchangeRate: number;
  /** Current market price in market currency. */
  currentPrice: number;
  /** Today's change in price (market currency, per share). */
  changeAbs: number;
  changeRate: number;
  /** Sum of all BUYs' KRW cost (moving avg net of SELLs). */
  investedKrw: number;
  /** quantity × currentPrice × avgExchangeRate. */
  marketValueKrw: number;
  unrealizedPnlKrw: number;
  unrealizedPnlRate: number;
  /** 0..100, share of total marketValueKrw. */
  weight: number;
  /** Sum of today's change attributed to this holding, in KRW. */
  todayChangeKrw: number;
};

export type Summary = {
  totalInvestedKrw: number;
  totalMarketValueKrw: number;
  totalUnrealizedPnlKrw: number;
  totalUnrealizedPnlRate: number;
  totalRealizedPnlKrw: number;
  holdingsCount: number;
  todayChangeKrw: number;
  todayChangeRate: number;
};

export type PortfolioResult = {
  trades: EnrichedTrade[];
  holdings: Holding[];
  summary: Summary;
};
