import { describe, expect, it } from "vitest";
import { alertHits, newAlertId, type PriceAlert } from "./types";

const A = (overrides: Partial<PriceAlert> = {}): PriceAlert => ({
  id: "a1",
  symbol: "005930",
  name: "삼성전자",
  market: "KR",
  direction: "above",
  targetPrice: 80_000,
  createdAt: "2025-01-01T00:00:00+09:00",
  ...overrides,
});

describe("alertHits", () => {
  it("above: 현재가가 목표 이상이면 hit", () => {
    expect(alertHits(A({ direction: "above", targetPrice: 100 }), 100)).toBe(true);
    expect(alertHits(A({ direction: "above", targetPrice: 100 }), 101)).toBe(true);
    expect(alertHits(A({ direction: "above", targetPrice: 100 }), 99)).toBe(false);
  });

  it("below: 현재가가 목표 이하면 hit", () => {
    expect(alertHits(A({ direction: "below", targetPrice: 100 }), 100)).toBe(true);
    expect(alertHits(A({ direction: "below", targetPrice: 100 }), 99)).toBe(true);
    expect(alertHits(A({ direction: "below", targetPrice: 100 }), 101)).toBe(false);
  });

  it("이미 발동된 (triggeredAt 있음) 알림은 다시 hit 안 함", () => {
    const triggered = A({
      direction: "above",
      targetPrice: 100,
      triggeredAt: "2025-01-02T00:00:00+09:00",
    });
    expect(alertHits(triggered, 999)).toBe(false);
  });

  it("비정상 가격 (0, 음수, NaN, Infinity) 은 hit 안 함", () => {
    expect(alertHits(A(), 0)).toBe(false);
    expect(alertHits(A(), -1)).toBe(false);
    expect(alertHits(A(), Number.NaN)).toBe(false);
    expect(alertHits(A(), Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("newAlertId", () => {
  it("고유 id 생성 (충돌 가능성 매우 낮음)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) ids.add(newAlertId());
    expect(ids.size).toBe(100);
  });

  it("a_ 접두사 + 시간/랜덤 조합", () => {
    const id = newAlertId();
    expect(id.startsWith("a_")).toBe(true);
    expect(id.length).toBeGreaterThan(5);
  });
});
