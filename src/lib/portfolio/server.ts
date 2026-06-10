import type { BrokerId } from "@/lib/brokers";
import { fetchUsdKrw } from "@/lib/quotes/fx";
import type { KisCreds } from "@/lib/quotes/kis";
import { fetchQuotes } from "@/lib/quotes/provider";
import { findSymbol } from "@/lib/quotes/symbols";
import type { Quote, SymbolEntry } from "@/lib/quotes/types";
import { SAMPLE_TRADES } from "./sample-trades";
import { buildPortfolio } from "./service";
import type { PortfolioResult, Trade } from "./types";

/** Resolve every distinct (market, symbol) seen in trades into Yahoo-compatible entries. */
function distinctSymbolEntries(trades: Trade[]): SymbolEntry[] {
  const seen = new Map<string, SymbolEntry>();
  for (const t of trades) {
    const key = `${t.market}:${t.symbol}`;
    if (seen.has(key)) continue;
    const found = findSymbol(t.symbol);
    if (found) seen.set(key, found);
  }
  return Array.from(seen.values());
}

/**
 * 가상 포트폴리오(SAMPLE_TRADES) 를 라이브 시세·환율과 조인해 빌드. 페이지가 호출하는
 * 유일한 진입점. 캐시 없음 — 매 요청마다 신선한 가격.
 *
 * `account` 로 한 계좌만 필터, 없으면 전체. `kisCreds` 가 있으면 KR 종목은 KIS API,
 * 그 외는 Yahoo Finance.
 *
 * 정보 제공용 앱 — 사용자 직접 거래 입력 경로는 없음. 향후 토스/KIS API 의 실거래
 * 내역 동기화로 자동 채워질 자리.
 */
export async function loadPortfolio(
  account?: BrokerId,
  kisCreds?: KisCreds | null,
): Promise<PortfolioResult> {
  const trades = account
    ? SAMPLE_TRADES.filter((t) => t.account === account)
    : SAMPLE_TRADES;
  const entries = distinctSymbolEntries(trades);
  // 시세와 USD/KRW 라이브 환율을 병렬로 — FX 한 번 더 부르는 비용 (~100ms) 보다
  // 평가금액 정확도가 훨씬 중요. fetchUsdKrw 실패해도 null 폴백.
  const [quotes, currentFx] = await Promise.all([
    fetchQuotes(entries, kisCreds),
    fetchUsdKrw(),
  ]);
  const map = new Map<string, Quote>();
  for (const q of quotes) map.set(q.symbol, q);
  return buildPortfolio(trades, map, currentFx);
}
