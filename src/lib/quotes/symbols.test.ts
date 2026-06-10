import { describe, expect, it } from "vitest";
import { findSymbol, searchSymbols } from "./symbols";

/*
  searchSymbols 회귀 테스트. 사용자 종목 검색에 들어가는 함수 — 잘못되면 거래 입력
  단계에서 종목을 못 찾는 등 직접 UX 영향.
*/

describe("findSymbol", () => {
  it("KR 6자리 코드로 찾기", () => {
    const r = findSymbol("005930");
    expect(r?.name).toBe("삼성전자");
    expect(r?.market).toBe("KR");
  });

  it("US 티커는 대문자도 매칭", () => {
    const r = findSymbol("AAPL");
    expect(r?.market).toBe("US");
  });

  it("US 티커 소문자도 찾음", () => {
    const r = findSymbol("aapl");
    expect(r?.market).toBe("US");
  });

  it("없는 심볼은 undefined", () => {
    expect(findSymbol("XXXX9999")).toBeUndefined();
  });

  it("yahooSymbol 로도 찾음", () => {
    const r = findSymbol("005930.KS");
    expect(r?.name).toBe("삼성전자");
  });
});

describe("searchSymbols", () => {
  it("빈 쿼리는 빈 배열", () => {
    expect(searchSymbols("")).toEqual([]);
    expect(searchSymbols("   ")).toEqual([]);
  });

  it("한글 이름 부분 일치 — 일부만 입력해도 매칭", () => {
    const r = searchSymbols("삼성");
    expect(r.some((s) => s.symbol === "005930")).toBe(true);
  });

  it("영문 이름 부분 일치", () => {
    const r = searchSymbols("apple");
    expect(r.some((s) => s.symbol === "AAPL")).toBe(true);
  });

  it("티커 그대로 — 정확 매칭이 prefix·substring 보다 우선", () => {
    const r = searchSymbols("AAPL");
    expect(r[0].symbol).toBe("AAPL"); // 정확 일치가 최상위
  });

  it("prefix 매칭이 substring 매칭보다 위", () => {
    const r = searchSymbols("000");
    // "000270" (기아) 같은 prefix 시작 코드가 substring 매칭보다 먼저.
    expect(r[0].symbol.startsWith("000")).toBe(true);
  });

  it("대소문자·공백 무시", () => {
    const upper = searchSymbols("APPLE");
    const lower = searchSymbols("apple");
    const padded = searchSymbols("  apple  ");
    expect(upper.length).toBeGreaterThan(0);
    expect(upper).toEqual(lower);
    expect(padded).toEqual(lower);
  });

  it("limit 옵션 준수", () => {
    const r = searchSymbols("a", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });

  it("없는 단어는 빈 배열", () => {
    const r = searchSymbols("zzzzzzz9999");
    expect(r).toEqual([]);
  });
});
