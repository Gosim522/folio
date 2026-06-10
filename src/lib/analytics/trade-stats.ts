import type { EnrichedTrade } from "@/lib/portfolio/types";

/*
  거래 통계 — 사용자 행동 메타. 완료된 SELL trade 중심으로 계산.

  계산 대상은 매도(SELL) 거래 — 청산되어 실현된 트레이드만 통계에 들어감.
  열려 있는 포지션은 통계 모집단에서 제외 (아직 결과가 안 정해짐).
*/

export type TradeStats = {
  totalTrades: number;
  closedSells: number;
  winRate: number; // 0..100 — closedSells 중 이익 본 비율
  avgReturnPct: number; // 평균 수익률 (%), 매도가 vs 평단 기준
  bestSymbol: { name: string; symbol: string; gainKrw: number } | null;
  worstSymbol: { name: string; symbol: string; gainKrw: number } | null;
  avgHoldingDays: number; // 매수→매도 평균 보유 일수 (단순화: 직전 매수와 매도의 차이)
};

const EMPTY: TradeStats = {
  totalTrades: 0,
  closedSells: 0,
  winRate: 0,
  avgReturnPct: 0,
  bestSymbol: null,
  worstSymbol: null,
  avgHoldingDays: 0,
};

export function computeTradeStats(trades: EnrichedTrade[]): TradeStats {
  if (trades.length === 0) return EMPTY;

  const sells = trades.filter(
    (t) => t.side === "SELL" && typeof t.realizedPnlKrw === "number",
  );

  if (sells.length === 0) {
    return { ...EMPTY, totalTrades: trades.length };
  }

  const wins = sells.filter((s) => (s.realizedPnlKrw ?? 0) > 0).length;
  const winRate = (wins / sells.length) * 100;

  // 평균 수익률: 매도가 vs 매도 직전 평단. avgPriceAfter 는 매도 후 평단이라
  // 의미가 다름 — 매도 직전 평단을 별도 계산해야 정확. 단순화: realizedPnl / (price*qty)
  // 비율을 사용 — 매도가가 100원, 평단이 80원, qty=1, realized=20 → 20% 수익.
  const returnPcts = sells
    .map((s) => {
      const proceeds = s.price * s.quantity;
      if (proceeds <= 0) return 0;
      // realizedPnl 은 매도 통화. 매도 통화 기준 수익률 = realized / cost = realized / (proceeds - realized)
      const cost = proceeds - (s.realizedPnl ?? 0);
      if (cost <= 0) return 0;
      return ((s.realizedPnl ?? 0) / cost) * 100;
    })
    .filter((p) => Number.isFinite(p));
  const avgReturnPct =
    returnPcts.length > 0
      ? returnPcts.reduce((a, b) => a + b, 0) / returnPcts.length
      : 0;

  // 종목별 누적 실현손익 → 최고/최저
  const bySymbol = new Map<string, { name: string; symbol: string; gainKrw: number }>();
  for (const s of sells) {
    const k = `${s.market}:${s.symbol}`;
    const cur = bySymbol.get(k) ?? { name: s.name, symbol: s.symbol, gainKrw: 0 };
    cur.gainKrw += s.realizedPnlKrw ?? 0;
    bySymbol.set(k, cur);
  }
  const ranked = Array.from(bySymbol.values()).sort(
    (a, b) => b.gainKrw - a.gainKrw,
  );
  const bestSymbol = ranked[0] ?? null;
  const worstSymbol =
    ranked.length > 1 ? ranked[ranked.length - 1] : null;

  // 평균 보유 일수 — 종목별 첫 매수일자와 마지막 매도일자의 차이를 평균 (단순화).
  const symbolFirstBuy = new Map<string, number>(); // unix ms
  const holdingDays: number[] = [];
  // trades 는 service 가 DESC (최신순) 으로 보내므로 ASC 로 재정렬 (시간순 재생).
  const asc = [...trades].sort((a, b) => (a.tradedAt < b.tradedAt ? -1 : 1));
  for (const t of asc) {
    const k = `${t.market}:${t.symbol}`;
    const ts = new Date(t.tradedAt).getTime();
    if (t.side === "BUY") {
      if (!symbolFirstBuy.has(k)) symbolFirstBuy.set(k, ts);
    } else {
      // SELL — 첫 매수 이후의 일수
      const firstBuyTs = symbolFirstBuy.get(k);
      if (firstBuyTs !== undefined) {
        const days = (ts - firstBuyTs) / (1000 * 60 * 60 * 24);
        if (Number.isFinite(days) && days >= 0) holdingDays.push(days);
        // 전량 매도하면 다음 매수가 새로운 시작점 — quantityAfter 0 이면 reset.
        if ((t.quantityAfter ?? 0) === 0) symbolFirstBuy.delete(k);
      }
    }
  }
  const avgHoldingDays =
    holdingDays.length > 0
      ? holdingDays.reduce((a, b) => a + b, 0) / holdingDays.length
      : 0;

  return {
    totalTrades: trades.length,
    closedSells: sells.length,
    winRate,
    avgReturnPct,
    bestSymbol,
    worstSymbol,
    avgHoldingDays,
  };
}
