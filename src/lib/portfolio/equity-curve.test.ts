import { describe, expect, it } from "vitest";
import { generateEquityCurve } from "./equity-curve";

describe("generateEquityCurve", () => {
  it("returns `days` points ending at endValue (today)", () => {
    const curve = generateEquityCurve(1_000_000, 30);
    expect(curve).toHaveLength(30);
    // 마지막 포인트가 endValue 와 일치 (반올림 오차 ±1).
    expect(curve[curve.length - 1].value).toBe(1_000_000);
  });

  it("deterministic — 같은 seed/endValue/days 면 같은 시리즈", () => {
    const a = generateEquityCurve(500_000, 60, 42);
    const b = generateEquityCurve(500_000, 60, 42);
    expect(a).toEqual(b);
  });

  it("다른 seed 는 다른 모양 (값 분포가 다름)", () => {
    const a = generateEquityCurve(500_000, 60, 42);
    const b = generateEquityCurve(500_000, 60, 99);
    // 마지막 값(endValue)은 같음, 중간은 달라야 함.
    expect(a[10].value).not.toBe(b[10].value);
  });

  it("date 들은 YYYY-MM-DD 형식이고 마지막은 오늘", () => {
    const curve = generateEquityCurve(100_000, 5);
    for (const p of curve) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedToday = today.toISOString().slice(0, 10);
    expect(curve[curve.length - 1].date).toBe(expectedToday);
  });

  it("date 들은 오름차순", () => {
    const curve = generateEquityCurve(100_000, 20);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].date >= curve[i - 1].date).toBe(true);
    }
  });

  it("짧은 range 가 긴 range 의 마지막 N 일과 일치 (시각적 연속성)", () => {
    const long = generateEquityCurve(1_000_000, 90);
    const short = generateEquityCurve(1_000_000, 30);
    // 마지막 30 일은 동일해야 함 — backward-walking PRNG 의 보장.
    const longLastValues = long.slice(-30).map((p) => p.value);
    const shortValues = short.map((p) => p.value);
    expect(shortValues).toEqual(longLastValues);
  });

  it("값들이 모두 양수 (denom 가드 동작)", () => {
    const curve = generateEquityCurve(1_000_000, 365);
    for (const p of curve) {
      expect(p.value).toBeGreaterThan(0);
    }
  });
});
