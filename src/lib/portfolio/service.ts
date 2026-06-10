import type { Quote } from "@/lib/quotes/types";
import type {
  EnrichedTrade,
  Holding,
  PortfolioResult,
  Summary,
  Trade,
} from "./types";

type SymbolKey = string; // `${market}:${symbol}`

type State = {
  market: Holding["market"];
  symbol: string;
  name: string;
  quantity: number;
  /** Sum of (qty × price) for remaining shares in market currency. */
  costBasis: number;
  /** Sum of (qty × price × exchangeRate) in KRW. */
  costBasisKrw: number;
};

function keyOf(t: { market: string; symbol: string }): SymbolKey {
  return `${t.market}:${t.symbol}`;
}

/**
 * Pure: replay trades chronologically and produce holdings + summary + enriched trades.
 *
 * `currentFx` 는 USD/KRW 라이브 환율 (예: 1450). 미지정 또는 null 이면 종목별 평균
 * 매수 환율로 폴백 (구버전 동작). KR 종목에는 영향 없음(항상 1).
 */
export function buildPortfolio(
  trades: Trade[],
  quotesBySymbol: Map<string, Quote> = new Map(),
  currentFx: number | null = null,
): PortfolioResult {
  const sorted = [...trades].sort((a, b) => {
    if (a.tradedAt !== b.tradedAt) return a.tradedAt < b.tradedAt ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  const states = new Map<SymbolKey, State>();
  const enriched: EnrichedTrade[] = [];
  let totalRealizedPnlKrw = 0;

  for (const t of sorted) {
    const k = keyOf(t);
    const s: State =
      states.get(k) ?? {
        market: t.market,
        symbol: t.symbol,
        name: t.name,
        quantity: 0,
        costBasis: 0,
        costBasisKrw: 0,
      };
    s.name = t.name; // keep latest

    let avgPriceAfter = s.quantity > 0 ? s.costBasis / s.quantity : 0;
    let realizedPnl: number | undefined;
    let realizedPnlKrw: number | undefined;

    if (t.side === "BUY") {
      // 원가 = 매수금액 + 매수 수수료 + 매수 세금 (일종의 "all-in" 실투자비용).
      // 결과적으로 표시되는 평단·실현손익 계산 모두 이 비용을 기준으로 잡힌다.
      const buyCostMarket = t.quantity * t.price + (t.fee ?? 0) + (t.tax ?? 0);
      s.quantity += t.quantity;
      s.costBasis += buyCostMarket;
      s.costBasisKrw += buyCostMarket * t.exchangeRate;
      avgPriceAfter = s.quantity > 0 ? s.costBasis / s.quantity : 0;
    } else {
      const sellQty = Math.min(t.quantity, s.quantity);
      const avgPriceBefore = s.quantity > 0 ? s.costBasis / s.quantity : t.price;
      const avgKrwBefore = s.quantity > 0 ? s.costBasisKrw / s.quantity : t.price * t.exchangeRate;
      // 매도 수수료·세금은 실제로 실현금에서 빠져나가므로 실현손익에서 차감.
      const sellCostsMarket = (t.fee ?? 0) + (t.tax ?? 0);

      realizedPnl = (t.price - avgPriceBefore) * sellQty - sellCostsMarket;
      realizedPnlKrw =
        (t.price * t.exchangeRate - avgKrwBefore) * sellQty -
        sellCostsMarket * t.exchangeRate;
      totalRealizedPnlKrw += realizedPnlKrw;

      s.quantity -= sellQty;
      s.costBasis -= avgPriceBefore * sellQty;
      s.costBasisKrw -= avgKrwBefore * sellQty;
      avgPriceAfter = s.quantity > 0 ? s.costBasis / s.quantity : 0;
    }

    states.set(k, s);
    enriched.push({
      ...t,
      avgPriceAfter,
      quantityAfter: s.quantity,
      realizedPnl,
      realizedPnlKrw,
    });
  }

  // Build holdings from non-zero states
  const holdings: Holding[] = [];
  for (const s of states.values()) {
    if (s.quantity <= 0) continue;
    const quote = quotesBySymbol.get(s.symbol);
    const avgPrice = s.costBasis / s.quantity;
    const avgExchangeRate = s.costBasis > 0 ? s.costBasisKrw / s.costBasis : 1;
    const currentPrice = quote?.price ?? avgPrice;
    const changeAbs = quote?.changeAbs ?? 0;
    const changeRate = quote?.changeRate ?? 0;
    // 평가금액·오늘 변화액은 "지금 시점" 의 환율로 환산해야 사용자가 보는 가치와
    // 일치한다. KR 종목은 환율 1 고정. US 종목은 라이브 USD/KRW (currentFx) 사용,
    // 못 받으면 cost-basis 평균 환율로 폴백.
    const isKr = s.market === "KR";
    const fxForCurrent = isKr ? 1 : (currentFx ?? avgExchangeRate);
    const marketValueKrw = s.quantity * currentPrice * fxForCurrent;
    const investedKrw = s.costBasisKrw;
    const unrealizedPnlKrw = marketValueKrw - investedKrw;
    const unrealizedPnlRate =
      investedKrw > 0 ? (unrealizedPnlKrw / investedKrw) * 100 : 0;
    const todayChangeKrw = s.quantity * changeAbs * fxForCurrent;

    holdings.push({
      symbol: s.symbol,
      market: s.market,
      name: s.name,
      currency: s.market === "KR" ? "KRW" : "USD",
      quantity: s.quantity,
      avgPrice,
      avgExchangeRate,
      currentPrice,
      changeAbs,
      changeRate,
      investedKrw,
      marketValueKrw,
      unrealizedPnlKrw,
      unrealizedPnlRate,
      weight: 0,
      todayChangeKrw,
    });
  }

  const totalMarketValueKrw = holdings.reduce((acc, h) => acc + h.marketValueKrw, 0);
  const totalInvestedKrw = holdings.reduce((acc, h) => acc + h.investedKrw, 0);
  const totalUnrealizedPnlKrw = totalMarketValueKrw - totalInvestedKrw;
  const totalUnrealizedPnlRate =
    totalInvestedKrw > 0 ? (totalUnrealizedPnlKrw / totalInvestedKrw) * 100 : 0;
  const todayChangeKrw = holdings.reduce((acc, h) => acc + h.todayChangeKrw, 0);
  const yesterdayMarketValueKrw = totalMarketValueKrw - todayChangeKrw;
  const todayChangeRate =
    yesterdayMarketValueKrw > 0 ? (todayChangeKrw / yesterdayMarketValueKrw) * 100 : 0;

  for (const h of holdings) {
    h.weight = totalMarketValueKrw > 0 ? (h.marketValueKrw / totalMarketValueKrw) * 100 : 0;
  }
  holdings.sort((a, b) => b.marketValueKrw - a.marketValueKrw);

  const summary: Summary = {
    totalInvestedKrw,
    totalMarketValueKrw,
    totalUnrealizedPnlKrw,
    totalUnrealizedPnlRate,
    totalRealizedPnlKrw,
    holdingsCount: holdings.length,
    todayChangeKrw,
    todayChangeRate,
  };

  enriched.sort((a, b) => (a.tradedAt < b.tradedAt ? 1 : -1));

  return { trades: enriched, holdings, summary };
}
