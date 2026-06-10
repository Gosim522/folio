import { describe, expect, it } from "vitest";
import type { EnrichedTrade } from "@/lib/portfolio/types";
import { computeTradeStats } from "./trade-stats";

const T = (overrides: Partial<EnrichedTrade> & { id: string }): EnrichedTrade => ({
  market: "KR",
  symbol: "005930",
  name: "삼성전자",
  side: "BUY",
  quantity: 10,
  price: 75_000,
  exchangeRate: 1,
  tradedAt: "2025-03-01T00:00:00+09:00",
  avgPriceAfter: 75_000,
  quantityAfter: 10,
  ...overrides,
});

describe("computeTradeStats", () => {
  it("빈 입력 → EMPTY", () => {
    const s = computeTradeStats([]);
    expect(s.totalTrades).toBe(0);
    expect(s.closedSells).toBe(0);
    expect(s.winRate).toBe(0);
    expect(s.bestSymbol).toBeNull();
  });

  it("매수만 있고 매도 없으면 통계는 0 (단, totalTrades 는 셈)", () => {
    const s = computeTradeStats([T({ id: "a", side: "BUY" })]);
    expect(s.totalTrades).toBe(1);
    expect(s.closedSells).toBe(0);
  });

  it("매도 2건 중 1건 이익 = win rate 50%", () => {
    const s = computeTradeStats([
      T({ id: "buy1", side: "BUY" }),
      T({ id: "sell-win", side: "SELL", realizedPnlKrw: 10_000, realizedPnl: 10_000, price: 85_000 }),
      T({ id: "sell-lose", side: "SELL", realizedPnlKrw: -5_000, realizedPnl: -5_000, price: 70_000 }),
    ]);
    expect(s.closedSells).toBe(2);
    expect(s.winRate).toBe(50);
  });

  it("평균 수익률 — 100원 평단을 110원에 매도 = +10% (1주)", () => {
    // proceeds = 110, realized = 10, cost = 100, return = 10/100 = 10%
    const s = computeTradeStats([
      T({
        id: "a",
        side: "SELL",
        price: 110,
        quantity: 1,
        realizedPnl: 10,
        realizedPnlKrw: 10,
      }),
    ]);
    expect(s.avgReturnPct).toBeCloseTo(10, 1);
  });

  it("종목별 누적 — 최고/최저", () => {
    const s = computeTradeStats([
      T({ id: "a", symbol: "AAA", name: "에이", side: "SELL", realizedPnlKrw: 100_000, realizedPnl: 100, price: 1000, quantity: 1 }),
      T({ id: "b", symbol: "BBB", name: "비비", side: "SELL", realizedPnlKrw: -50_000, realizedPnl: -50, price: 1000, quantity: 1 }),
      T({ id: "c", symbol: "AAA", name: "에이", side: "SELL", realizedPnlKrw: 30_000, realizedPnl: 30, price: 1000, quantity: 1 }),
    ]);
    expect(s.bestSymbol?.symbol).toBe("AAA");
    expect(s.bestSymbol?.gainKrw).toBe(130_000);
    expect(s.worstSymbol?.symbol).toBe("BBB");
  });

  it("평균 보유 기간 — 1매수 후 10일 뒤 1매도 = 10일", () => {
    const s = computeTradeStats([
      T({
        id: "buy",
        side: "BUY",
        tradedAt: "2025-01-01T00:00:00+09:00",
        quantity: 1,
        quantityAfter: 1,
      }),
      T({
        id: "sell",
        side: "SELL",
        tradedAt: "2025-01-11T00:00:00+09:00",
        quantity: 1,
        quantityAfter: 0,
        realizedPnl: 5,
        realizedPnlKrw: 5,
        price: 100,
      }),
    ]);
    expect(s.avgHoldingDays).toBeCloseTo(10, 1);
  });
});
