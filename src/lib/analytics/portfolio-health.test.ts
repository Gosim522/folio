import { describe, expect, it } from "vitest";
import type { Holding } from "@/lib/portfolio/types";
import { diagnosePortfolio } from "./portfolio-health";

const H = (overrides: Partial<Holding>): Holding => ({
  symbol: "X",
  market: "KR",
  name: "X",
  currency: "KRW",
  quantity: 10,
  avgPrice: 100,
  avgExchangeRate: 1,
  currentPrice: 110,
  changeAbs: 0,
  changeRate: 0,
  investedKrw: 1000,
  marketValueKrw: 1100,
  unrealizedPnlKrw: 100,
  unrealizedPnlRate: 10,
  weight: 0,
  todayChangeKrw: 0,
  ...overrides,
});

describe("diagnosePortfolio", () => {
  it("빈 포트폴리오 — empty indicator + score 0", () => {
    const r = diagnosePortfolio([]);
    expect(r.score).toBe(0);
    expect(r.indicators[0].key).toBe("empty");
  });

  it("충분히 분산된 KR/US 포트폴리오 (8종목) — 집중도 good + 지역 good", () => {
    // 8 종목 × 12.5% = top3 37.5% → good (50% 미만)
    const r = diagnosePortfolio([
      H({ symbol: "A", weight: 12.5, marketValueKrw: 125, unrealizedPnlKrw: 30 }),
      H({ symbol: "B", weight: 12.5, marketValueKrw: 125, unrealizedPnlKrw: -10 }),
      H({ symbol: "C", weight: 12.5, marketValueKrw: 125, unrealizedPnlKrw: 50 }),
      H({ symbol: "D", weight: 12.5, marketValueKrw: 125, unrealizedPnlKrw: 20 }),
      H({
        symbol: "E",
        market: "US",
        weight: 12.5,
        marketValueKrw: 125,
        unrealizedPnlKrw: 30,
      }),
      H({
        symbol: "F",
        market: "US",
        weight: 12.5,
        marketValueKrw: 125,
        unrealizedPnlKrw: 15,
      }),
      H({
        symbol: "G",
        market: "US",
        weight: 12.5,
        marketValueKrw: 125,
        unrealizedPnlKrw: -5,
      }),
      H({
        symbol: "H",
        market: "US",
        weight: 12.5,
        marketValueKrw: 125,
        unrealizedPnlKrw: 10,
      }),
    ]);
    const concentration = r.indicators.find((i) => i.key === "concentration");
    expect(concentration?.level).toBe("good");
    const region = r.indicators.find((i) => i.key === "region");
    expect(region?.level).toBe("good");
  });

  it("top3 집중도 70% 이상 — danger", () => {
    const r = diagnosePortfolio([
      H({ symbol: "A", weight: 40, marketValueKrw: 400 }),
      H({ symbol: "B", weight: 30, marketValueKrw: 300 }),
      H({ symbol: "C", weight: 20, marketValueKrw: 200 }),
      H({ symbol: "D", weight: 10, marketValueKrw: 100 }),
    ]);
    const concentration = r.indicators.find((i) => i.key === "concentration");
    expect(concentration?.level).toBe("danger");
  });

  it("국내 100% — region warning", () => {
    const r = diagnosePortfolio([
      H({ market: "KR", weight: 50, marketValueKrw: 500 }),
      H({ market: "KR", weight: 50, marketValueKrw: 500, symbol: "B" }),
    ]);
    const region = r.indicators.find((i) => i.key === "region");
    expect(region?.level).toBe("warning");
  });

  it("종목 2개 이하 — diversity warning", () => {
    const r = diagnosePortfolio([
      H({ symbol: "A", weight: 50, marketValueKrw: 500 }),
      H({ symbol: "B", weight: 50, marketValueKrw: 500 }),
    ]);
    const diversity = r.indicators.find((i) => i.key === "diversity");
    expect(diversity?.level).toBe("warning");
  });

  it("60% 이상 손실 — losses danger", () => {
    const r = diagnosePortfolio([
      H({ symbol: "A", weight: 25, marketValueKrw: 250, unrealizedPnlKrw: -50 }),
      H({ symbol: "B", weight: 25, marketValueKrw: 250, unrealizedPnlKrw: -50 }),
      H({ symbol: "C", weight: 25, marketValueKrw: 250, unrealizedPnlKrw: -50 }),
      H({ symbol: "D", weight: 25, marketValueKrw: 250, unrealizedPnlKrw: 50 }),
    ]);
    const losses = r.indicators.find((i) => i.key === "losses");
    expect(losses?.level).toBe("danger");
  });
});
