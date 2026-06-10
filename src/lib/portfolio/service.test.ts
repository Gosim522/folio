import { describe, expect, it } from "vitest";
import type { Quote } from "@/lib/quotes/types";
import { buildPortfolio } from "./service";
import type { Trade } from "./types";

/*
  buildPortfolio 회귀 테스트. 손익 계산이 미묘하므로 (이동평균 cost basis, dual KRW
  트랙, 수수료/세금 차감, 라이브 FX 환산) 한 케이스라도 깨지면 사용자의 평단/실현손익
  /평가금액이 잘못 표시될 수 있다.
*/

const Q = (
  symbol: string,
  price: number,
  changeAbs = 0,
  changeRate = 0,
): Quote => ({
  symbol,
  yahooSymbol: symbol,
  name: symbol,
  market: "KR",
  price,
  previousClose: price - changeAbs,
  dayHigh: price,
  dayLow: price,
  volume: 0,
  changeAbs,
  changeRate,
  currency: "KRW",
  fetchedAt: 0,
});

const T = (overrides: Partial<Trade> & { id: string }): Trade => ({
  market: "KR",
  symbol: "005930",
  name: "삼성전자",
  side: "BUY",
  quantity: 1,
  price: 75000,
  exchangeRate: 1,
  tradedAt: "2025-01-02T00:00:00+09:00",
  ...overrides,
});

describe("buildPortfolio", () => {
  it("returns empty result for no trades", () => {
    const r = buildPortfolio([]);
    expect(r.holdings).toHaveLength(0);
    expect(r.trades).toHaveLength(0);
    expect(r.summary.totalInvestedKrw).toBe(0);
    expect(r.summary.totalRealizedPnlKrw).toBe(0);
  });

  it("single BUY → 1 holding with correct qty & avg", () => {
    const r = buildPortfolio(
      [T({ id: "t1", quantity: 10, price: 75000 })],
      new Map([["005930", Q("005930", 80000)]]),
    );
    expect(r.holdings).toHaveLength(1);
    const h = r.holdings[0];
    expect(h.quantity).toBe(10);
    expect(h.avgPrice).toBe(75000);
    expect(h.currentPrice).toBe(80000);
    expect(h.investedKrw).toBe(750_000);
    expect(h.marketValueKrw).toBe(800_000);
    expect(h.unrealizedPnlKrw).toBe(50_000);
  });

  it("BUY fee/tax fold into cost basis (effective avgPrice goes up)", () => {
    const r = buildPortfolio([
      T({ id: "t1", quantity: 10, price: 10_000, fee: 1_000 }),
    ]);
    const h = r.holdings[0];
    // (10*10000 + 1000) / 10 = 10100
    expect(h.avgPrice).toBe(10_100);
    expect(h.investedKrw).toBe(101_000);
  });

  it("BUY → SELL realized PnL correct, fee+tax reduce realized", () => {
    const trades: Trade[] = [
      T({ id: "t1", quantity: 10, price: 10_000 }),
      T({
        id: "t2",
        quantity: 5,
        price: 12_000,
        side: "SELL",
        fee: 100,
        tax: 200,
      }),
    ];
    const r = buildPortfolio(trades);
    // Raw gain: (12000 - 10000) * 5 = 10000. Less fees 100+200 = 9700.
    const sell = r.trades.find((t) => t.id === "t2");
    expect(sell?.realizedPnlKrw).toBe(9_700);
    expect(r.summary.totalRealizedPnlKrw).toBe(9_700);
    // 5 shares remaining at original avg (no change in basis from SELL).
    const h = r.holdings[0];
    expect(h.quantity).toBe(5);
    expect(h.avgPrice).toBe(10_000);
  });

  it("moving average across two BUYs", () => {
    const trades: Trade[] = [
      T({ id: "t1", quantity: 10, price: 10_000 }),
      T({ id: "t2", quantity: 10, price: 12_000 }),
    ];
    const r = buildPortfolio(trades);
    const h = r.holdings[0];
    expect(h.quantity).toBe(20);
    expect(h.avgPrice).toBe(11_000);
  });

  it("US trade: live FX used for marketValueKrw, cost FX preserved in invested", () => {
    const trades: Trade[] = [
      T({
        id: "t1",
        market: "US",
        symbol: "AAPL",
        name: "Apple",
        quantity: 2,
        price: 200, // USD
        exchangeRate: 1300, // KRW per USD at buy time
      }),
    ];
    const quotes = new Map([
      ["AAPL", { ...Q("AAPL", 220), market: "US", currency: "USD" } as Quote],
    ]);
    const liveFx = 1450; // KRW per USD now
    const r = buildPortfolio(trades, quotes, liveFx);
    const h = r.holdings[0];
    // invested at buy FX: 2 * 200 * 1300 = 520_000
    expect(h.investedKrw).toBe(520_000);
    // marketValue at live FX: 2 * 220 * 1450 = 638_000
    expect(h.marketValueKrw).toBe(638_000);
    // unrealized = 118_000 (includes both price gain AND FX gain)
    expect(h.unrealizedPnlKrw).toBe(118_000);
  });

  it("US trade: missing live FX → falls back to cost-basis FX (no FX effect)", () => {
    const trades: Trade[] = [
      T({
        id: "t1",
        market: "US",
        symbol: "AAPL",
        name: "Apple",
        quantity: 2,
        price: 200,
        exchangeRate: 1300,
      }),
    ];
    const quotes = new Map([
      ["AAPL", { ...Q("AAPL", 220), market: "US", currency: "USD" } as Quote],
    ]);
    const r = buildPortfolio(trades, quotes, null);
    const h = r.holdings[0];
    expect(h.marketValueKrw).toBe(2 * 220 * 1300);
  });

  it("multiple symbols: weights sum to ~100", () => {
    const trades: Trade[] = [
      T({ id: "t1", symbol: "005930", quantity: 10, price: 80_000 }),
      T({
        id: "t2",
        symbol: "035720",
        name: "카카오",
        quantity: 20,
        price: 50_000,
      }),
    ];
    const quotes = new Map([
      ["005930", Q("005930", 80_000)],
      ["035720", Q("035720", 50_000)],
    ]);
    const r = buildPortfolio(trades, quotes);
    const sumWeights = r.holdings.reduce((acc, h) => acc + h.weight, 0);
    expect(sumWeights).toBeCloseTo(100, 5);
    // Larger one first (sort by marketValueKrw desc).
    expect(r.holdings[0].symbol).toBe("035720");
  });

  it("trades chronologically sorted in enriched output even if input is unsorted", () => {
    const trades: Trade[] = [
      T({ id: "t2", tradedAt: "2025-01-05T00:00:00+09:00", quantity: 5 }),
      T({ id: "t1", tradedAt: "2025-01-01T00:00:00+09:00", quantity: 10 }),
    ];
    const r = buildPortfolio(trades);
    // Enriched is sorted DESC by tradedAt (newest first per service.ts).
    expect(r.trades[0].id).toBe("t2");
    expect(r.trades[1].id).toBe("t1");
    // But avgPrice on t2 must reflect the t1 BUY having been applied first.
    expect(r.trades[1].quantityAfter).toBe(10);
    expect(r.trades[0].quantityAfter).toBe(15);
  });

  it("SELL more than held → caps at held quantity", () => {
    const trades: Trade[] = [
      T({ id: "t1", quantity: 5 }),
      T({ id: "t2", quantity: 100, side: "SELL", price: 80_000 }),
    ];
    const r = buildPortfolio(trades);
    expect(r.holdings).toHaveLength(0); // sold all (capped at 5)
    const sell = r.trades.find((t) => t.id === "t2");
    // Realized: only 5 shares sold at 80000 vs 75000 avg = 25000 gain
    expect(sell?.realizedPnlKrw).toBe(25_000);
  });

  it("today change reflects live FX for US holdings", () => {
    const trades: Trade[] = [
      T({
        id: "t1",
        market: "US",
        symbol: "AAPL",
        name: "Apple",
        quantity: 10,
        price: 200,
        exchangeRate: 1300,
      }),
    ];
    const quotes = new Map([
      [
        "AAPL",
        {
          ...Q("AAPL", 205, 5, 2.5),
          market: "US",
          currency: "USD",
        } as Quote,
      ],
    ]);
    const r = buildPortfolio(trades, quotes, 1450);
    const h = r.holdings[0];
    // today change: 10 shares * $5 * 1450 = 72500
    expect(h.todayChangeKrw).toBe(72_500);
  });
});
