import { fetchYahooChart } from "./yahoo";

/**
 * 현재 USD/KRW 환율 한 번 가져오기 (Yahoo `KRW=X`).
 * 실패하면 null — 호출자는 평균 매수 환율 등으로 폴백.
 * loadPortfolio 가 평가금액 KRW 환산에 쓰는 "현재 환율" 소스.
 */
export async function fetchUsdKrw(): Promise<number | null> {
  try {
    const chart = await fetchYahooChart("KRW=X", {
      range: "1d",
      interval: "1d",
    });
    const price = chart?.meta?.regularMarketPrice;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}
