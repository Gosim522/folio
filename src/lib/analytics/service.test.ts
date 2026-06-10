import { describe, expect, it } from "vitest";
import type { EnrichedTrade, Holding } from "@/lib/portfolio/types";
import {
  marketBreakdown,
  monthlyActivity,
  monthlyRealizedPnl,
  taxSimulation,
} from "./service";

const T = (overrides: Partial<EnrichedTrade> & { id: string }): EnrichedTrade => ({
  market: "KR",
  symbol: "005930",
  name: "삼성전자",
  side: "SELL",
  quantity: 1,
  price: 80_000,
  exchangeRate: 1,
  tradedAt: "2025-03-15T00:00:00+09:00",
  avgPriceAfter: 0,
  quantityAfter: 0,
  realizedPnlKrw: 10_000,
  ...overrides,
});

const H = (overrides: Partial<Holding>): Holding => ({
  symbol: "005930",
  market: "KR",
  name: "삼성전자",
  currency: "KRW",
  quantity: 10,
  avgPrice: 75_000,
  avgExchangeRate: 1,
  currentPrice: 80_000,
  changeAbs: 0,
  changeRate: 0,
  investedKrw: 750_000,
  marketValueKrw: 800_000,
  unrealizedPnlKrw: 50_000,
  unrealizedPnlRate: 6.67,
  weight: 0,
  todayChangeKrw: 0,
  ...overrides,
});

describe("monthlyRealizedPnl", () => {
  it("buckets SELL trades by YYYY-MM and sums realized PnL", () => {
    const r = monthlyRealizedPnl([
      T({ id: "a", tradedAt: "2025-03-01T00:00:00+09:00", realizedPnlKrw: 10_000 }),
      T({ id: "b", tradedAt: "2025-03-20T00:00:00+09:00", realizedPnlKrw: 5_000 }),
      T({ id: "c", tradedAt: "2025-04-05T00:00:00+09:00", realizedPnlKrw: -2_000 }),
    ]);
    expect(r).toEqual([
      { month: "2025-03", realizedPnlKrw: 15_000 },
      { month: "2025-04", realizedPnlKrw: -2_000 },
    ]);
  });

  it("ignores BUY trades and SELLs without realizedPnlKrw", () => {
    const r = monthlyRealizedPnl([
      T({ id: "a", side: "BUY", realizedPnlKrw: undefined }),
      T({ id: "b", side: "SELL", realizedPnlKrw: undefined }),
      T({ id: "c", realizedPnlKrw: 1_000 }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].realizedPnlKrw).toBe(1_000);
  });

  it("returns chronologically sorted months", () => {
    const r = monthlyRealizedPnl([
      T({ id: "a", tradedAt: "2025-05-01T00:00:00+09:00" }),
      T({ id: "b", tradedAt: "2025-01-01T00:00:00+09:00" }),
      T({ id: "c", tradedAt: "2025-03-01T00:00:00+09:00" }),
    ]);
    expect(r.map((p) => p.month)).toEqual(["2025-01", "2025-03", "2025-05"]);
  });
});

describe("monthlyActivity", () => {
  it("counts buys and sells per month", () => {
    const r = monthlyActivity([
      T({ id: "a", side: "BUY", tradedAt: "2025-02-01T00:00:00+09:00" }),
      T({ id: "b", side: "BUY", tradedAt: "2025-02-15T00:00:00+09:00" }),
      T({ id: "c", side: "SELL", tradedAt: "2025-02-20T00:00:00+09:00" }),
      T({ id: "d", side: "BUY", tradedAt: "2025-03-01T00:00:00+09:00" }),
    ]);
    expect(r).toEqual([
      { month: "2025-02", buys: 2, sells: 1 },
      { month: "2025-03", buys: 1, sells: 0 },
    ]);
  });
});

describe("marketBreakdown", () => {
  it("groups holdings by market and computes weights", () => {
    const r = marketBreakdown([
      H({ symbol: "005930", market: "KR", marketValueKrw: 600_000, investedKrw: 500_000 }),
      H({ symbol: "035720", market: "KR", marketValueKrw: 400_000, investedKrw: 350_000 }),
      H({
        symbol: "AAPL",
        market: "US",
        currency: "USD",
        marketValueKrw: 1_000_000,
        investedKrw: 800_000,
      }),
    ]);
    expect(r).toHaveLength(2);
    const kr = r.find((m) => m.market === "KR")!;
    const us = r.find((m) => m.market === "US")!;
    expect(kr.marketValueKrw).toBe(1_000_000);
    expect(kr.count).toBe(2);
    expect(kr.weight).toBeCloseTo(50, 2); // 1M of 2M
    expect(us.marketValueKrw).toBe(1_000_000);
    expect(us.count).toBe(1);
    expect(us.weight).toBeCloseTo(50, 2);
  });

  it("KR comes before US (consistent order)", () => {
    const r = marketBreakdown([
      H({ symbol: "AAPL", market: "US", marketValueKrw: 1_000_000 }),
      H({ symbol: "005930", market: "KR", marketValueKrw: 500_000 }),
    ]);
    expect(r.map((m) => m.market)).toEqual(["KR", "US"]);
  });
});

describe("taxSimulation", () => {
  it("KR realized is no-op tax-wise (소액주주 비과세 가정)", () => {
    const r = taxSimulation([
      T({ id: "a", market: "KR", realizedPnlKrw: 5_000_000 }),
    ]);
    expect(r.krRealizedKrw).toBe(5_000_000);
    expect(r.usEstimatedTaxKrw).toBe(0);
    expect(r.totalEstimatedTaxKrw).toBe(0);
  });

  it("US realized under 2.5M 공제 → 세금 0", () => {
    const r = taxSimulation([
      T({ id: "a", market: "US", realizedPnlKrw: 2_000_000 }),
    ]);
    expect(r.usRealizedKrw).toBe(2_000_000);
    expect(r.usTaxableKrw).toBe(0);
    expect(r.usEstimatedTaxKrw).toBe(0);
  });

  it("US realized over 2.5M → 초과분 22%", () => {
    const r = taxSimulation([
      T({ id: "a", market: "US", realizedPnlKrw: 10_000_000 }),
    ]);
    // 과세표준 = 10,000,000 - 2,500,000 = 7,500,000
    // 세금 = 7,500,000 * 0.22 = 1,650,000
    expect(r.usTaxableKrw).toBe(7_500_000);
    expect(r.usEstimatedTaxKrw).toBe(1_650_000);
    expect(r.totalEstimatedTaxKrw).toBe(1_650_000);
  });

  it("US 손실은 세금 0 (음수 합산은 0 으로 절단)", () => {
    const r = taxSimulation([
      T({ id: "a", market: "US", realizedPnlKrw: -5_000_000 }),
    ]);
    expect(r.usRealizedKrw).toBe(-5_000_000);
    expect(r.usTaxableKrw).toBe(0);
    expect(r.usEstimatedTaxKrw).toBe(0);
  });
});
