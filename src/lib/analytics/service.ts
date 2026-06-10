import type { Market } from "@/lib/quotes/types";
import type { EnrichedTrade, Holding } from "@/lib/portfolio/types";

export type MonthlyPnlPoint = {
  month: string; // YYYY-MM
  realizedPnlKrw: number;
};

export function monthlyRealizedPnl(trades: EnrichedTrade[]): MonthlyPnlPoint[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    if (t.side !== "SELL" || typeof t.realizedPnlKrw !== "number") continue;
    const month = t.tradedAt.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + t.realizedPnlKrw);
  }
  return Array.from(map.entries())
    .map(([month, realizedPnlKrw]) => ({ month, realizedPnlKrw }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));
}

export type ActivityPoint = {
  month: string;
  buys: number;
  sells: number;
};

export function monthlyActivity(trades: EnrichedTrade[]): ActivityPoint[] {
  const map = new Map<string, { buys: number; sells: number }>();
  for (const t of trades) {
    const month = t.tradedAt.slice(0, 7);
    const cur = map.get(month) ?? { buys: 0, sells: 0 };
    if (t.side === "BUY") cur.buys++;
    else cur.sells++;
    map.set(month, cur);
  }
  return Array.from(map.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));
}

export type MarketBreakdown = {
  market: Market;
  label: string;
  marketValueKrw: number;
  investedKrw: number;
  weight: number;
  count: number;
};

export function marketBreakdown(holdings: Holding[]): MarketBreakdown[] {
  const total = holdings.reduce((acc, h) => acc + h.marketValueKrw, 0);
  const map = new Map<Market, { mv: number; inv: number; count: number }>();
  for (const h of holdings) {
    const cur = map.get(h.market) ?? { mv: 0, inv: 0, count: 0 };
    cur.mv += h.marketValueKrw;
    cur.inv += h.investedKrw;
    cur.count++;
    map.set(h.market, cur);
  }
  const order: Market[] = ["KR", "US"];
  return order
    .filter((m) => map.has(m))
    .map((m) => {
      const v = map.get(m)!;
      return {
        market: m,
        label: m === "KR" ? "국내" : "해외",
        marketValueKrw: v.mv,
        investedKrw: v.inv,
        count: v.count,
        weight: total > 0 ? (v.mv / total) * 100 : 0,
      };
    });
}

export type TaxSimulation = {
  krRealizedKrw: number;
  usRealizedKrw: number;
  usDeductionKrw: number;
  usTaxableKrw: number;
  usEstimatedTaxKrw: number;
  totalEstimatedTaxKrw: number;
};

const US_DEDUCTION_KRW = 2_500_000;
const US_TAX_RATE = 0.22;

export function taxSimulation(trades: EnrichedTrade[]): TaxSimulation {
  let krRealizedKrw = 0;
  let usRealizedKrw = 0;
  for (const t of trades) {
    if (t.side !== "SELL" || typeof t.realizedPnlKrw !== "number") continue;
    if (t.market === "KR") krRealizedKrw += t.realizedPnlKrw;
    else usRealizedKrw += t.realizedPnlKrw;
  }
  const usTaxableKrw = Math.max(0, usRealizedKrw - US_DEDUCTION_KRW);
  const usEstimatedTaxKrw = usTaxableKrw * US_TAX_RATE;
  return {
    krRealizedKrw,
    usRealizedKrw,
    usDeductionKrw: US_DEDUCTION_KRW,
    usTaxableKrw,
    usEstimatedTaxKrw,
    totalEstimatedTaxKrw: usEstimatedTaxKrw,
  };
}
