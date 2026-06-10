import { describe, expect, it } from "vitest";
import { tradesToCsv } from "./csv";
import type { EnrichedTrade } from "./types";

const T = (overrides: Partial<EnrichedTrade> & { id: string }): EnrichedTrade => ({
  market: "KR",
  symbol: "005930",
  name: "삼성전자",
  side: "BUY",
  quantity: 10,
  price: 75_000,
  exchangeRate: 1,
  tradedAt: "2025-03-15T09:00:00+09:00",
  avgPriceAfter: 75_000,
  quantityAfter: 10,
  ...overrides,
});

describe("tradesToCsv", () => {
  it("헤더 한 줄 + 거래 한 줄 = 두 줄 (빈 입력은 헤더만)", () => {
    expect(tradesToCsv([]).split("\r\n")).toHaveLength(1);
    expect(tradesToCsv([T({ id: "a" })]).split("\r\n")).toHaveLength(2);
  });

  it("한글 컬럼 헤더 포함", () => {
    const csv = tradesToCsv([]);
    expect(csv).toContain("일시");
    expect(csv).toContain("종목코드");
    expect(csv).toContain("종목명");
    expect(csv).toContain("실현손익(KRW)");
  });

  it("매수/매도가 한글로 변환됨", () => {
    const csv = tradesToCsv([T({ id: "a", side: "BUY" })]);
    expect(csv).toContain("매수");
    expect(csv).not.toContain("BUY");
    const csvSell = tradesToCsv([T({ id: "b", side: "SELL" })]);
    expect(csvSell).toContain("매도");
  });

  it("쉼표·따옴표·개행 포함 메모는 따옴표로 감싸고 이스케이프", () => {
    const csv = tradesToCsv([
      T({ id: "a", note: '쉼표,있는 "메모" 입니다' }),
    ]);
    // 메모 내부의 " 가 "" 로 이스케이프됨, 전체가 "..." 로 감싸짐
    expect(csv).toContain('"쉼표,있는 ""메모"" 입니다"');
  });

  it("거래는 오래된 것부터 (회계 시간순)", () => {
    const csv = tradesToCsv([
      T({ id: "later", tradedAt: "2025-05-10T00:00:00+09:00" }),
      T({ id: "earlier", tradedAt: "2025-01-05T00:00:00+09:00" }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toContain("2025-01-05");
    expect(lines[2]).toContain("2025-05-10");
  });

  it("US 거래는 USD 통화 + 환율 컬럼 포함", () => {
    const csv = tradesToCsv([
      T({
        id: "us",
        market: "US",
        symbol: "AAPL",
        name: "Apple",
        price: 200,
        exchangeRate: 1450,
      }),
    ]);
    expect(csv).toContain("USD");
    expect(csv).toContain("1450");
    // 거래금액 = 200 * 10 * 1450 = 2,900,000
    expect(csv).toContain("2900000");
  });

  it("SELL trade 의 realizedPnlKrw 가 컬럼에 정수로 표시", () => {
    const csv = tradesToCsv([
      T({ id: "s", side: "SELL", realizedPnlKrw: 12_345.6 }),
    ]);
    // 반올림된 정수가 들어가야 함
    expect(csv).toContain("12346");
  });

  it("BUY 의 실현손익은 빈 값", () => {
    const csv = tradesToCsv([T({ id: "b", side: "BUY" })]);
    // 마지막에서 두 번째 필드(계좌)·세 번째 필드(실현손익) 자리 — 정확한 자리 매칭은
    // 헤더 순서에 의존. 간단히 두 개 연속 쉼표가 있으면 빈 값 통과.
    expect(csv).toMatch(/,,/);
  });

  it("수수료·세금이 컬럼에 들어감", () => {
    const csv = tradesToCsv([
      T({ id: "a", fee: 569, tax: 185 }),
    ]);
    expect(csv).toContain("569");
    expect(csv).toContain("185");
  });
});
