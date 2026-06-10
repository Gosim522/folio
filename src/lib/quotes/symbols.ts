import type { SymbolEntry } from "./types";

/**
 * Curated starter watchlist — drives the 시세 (Quotes) section.
 * Kept as the first slice of SYMBOL_CATALOG so its display order is stable.
 */
export const DEFAULT_WATCHLIST: SymbolEntry[] = [
  // KR · KOSPI
  { symbol: "005930", yahooSymbol: "005930.KS", name: "삼성전자", market: "KR", aliases: ["samsung"] },
  { symbol: "000660", yahooSymbol: "000660.KS", name: "SK하이닉스", market: "KR", aliases: ["sk hynix", "hynix"] },
  { symbol: "207940", yahooSymbol: "207940.KS", name: "삼성바이오로직스", market: "KR", aliases: ["samsung biologics"] },
  { symbol: "373220", yahooSymbol: "373220.KS", name: "LG에너지솔루션", market: "KR", aliases: ["lg energy solution", "lg엔솔"] },
  { symbol: "005380", yahooSymbol: "005380.KS", name: "현대차", market: "KR", aliases: ["hyundai", "hyundai motor"] },
  { symbol: "035420", yahooSymbol: "035420.KS", name: "NAVER", market: "KR", nameKo: "네이버", aliases: ["naver"] },
  { symbol: "035720", yahooSymbol: "035720.KS", name: "카카오", market: "KR", aliases: ["kakao"] },
  { symbol: "068270", yahooSymbol: "068270.KS", name: "셀트리온", market: "KR", aliases: ["celltrion"] },
  { symbol: "005490", yahooSymbol: "005490.KS", name: "POSCO홀딩스", market: "KR", aliases: ["posco", "포스코"] },
  { symbol: "105560", yahooSymbol: "105560.KS", name: "KB금융", market: "KR", aliases: ["kb financial"] },
  { symbol: "051910", yahooSymbol: "051910.KS", name: "LG화학", market: "KR", aliases: ["lg chem"] },
  // KR · KOSDAQ
  { symbol: "247540", yahooSymbol: "247540.KQ", name: "에코프로비엠", market: "KR", aliases: ["ecopro bm"] },

  // US · large caps
  { symbol: "AAPL", yahooSymbol: "AAPL", name: "Apple", market: "US", nameKo: "애플" },
  { symbol: "MSFT", yahooSymbol: "MSFT", name: "Microsoft", market: "US", nameKo: "마이크로소프트" },
  { symbol: "NVDA", yahooSymbol: "NVDA", name: "NVIDIA", market: "US", nameKo: "엔비디아" },
  { symbol: "GOOGL", yahooSymbol: "GOOGL", name: "Alphabet", market: "US", nameKo: "알파벳", aliases: ["google", "구글"] },
  { symbol: "AMZN", yahooSymbol: "AMZN", name: "Amazon", market: "US", nameKo: "아마존" },
  { symbol: "META", yahooSymbol: "META", name: "Meta", market: "US", nameKo: "메타", aliases: ["facebook", "페이스북"] },
  { symbol: "TSLA", yahooSymbol: "TSLA", name: "Tesla", market: "US", nameKo: "테슬라" },
  { symbol: "AVGO", yahooSymbol: "AVGO", name: "Broadcom", market: "US", nameKo: "브로드컴" },
  { symbol: "COST", yahooSymbol: "COST", name: "Costco", market: "US", nameKo: "코스트코" },
  { symbol: "NFLX", yahooSymbol: "NFLX", name: "Netflix", market: "US", nameKo: "넷플릭스" },
  { symbol: "AMD", yahooSymbol: "AMD", name: "AMD", market: "US", nameKo: "에이엠디", aliases: ["advanced micro devices"] },
  { symbol: "PLTR", yahooSymbol: "PLTR", name: "Palantir", market: "US", nameKo: "팔란티어" },
];

/**
 * Extra symbols searchable in the 모의 투자 widget — more KR/US large caps,
 * broad ETFs, and leverage/inverse ETFs. Not fetched up front; their quotes
 * are loaded on demand when the user searches or holds them.
 */
const CATALOG_EXTRA: SymbolEntry[] = [
  // KR · additional large/mid caps
  { symbol: "000270", yahooSymbol: "000270.KS", name: "기아", market: "KR", aliases: ["kia"] },
  { symbol: "012330", yahooSymbol: "012330.KS", name: "현대모비스", market: "KR", aliases: ["hyundai mobis"] },
  { symbol: "066570", yahooSymbol: "066570.KS", name: "LG전자", market: "KR", aliases: ["lg electronics"] },
  { symbol: "006400", yahooSymbol: "006400.KS", name: "삼성SDI", market: "KR", aliases: ["samsung sdi"] },
  { symbol: "323410", yahooSymbol: "323410.KS", name: "카카오뱅크", market: "KR", aliases: ["kakaobank"] },
  { symbol: "259960", yahooSymbol: "259960.KS", name: "크래프톤", market: "KR", aliases: ["krafton"] },
  { symbol: "042700", yahooSymbol: "042700.KS", name: "한미반도체", market: "KR", aliases: ["hanmi semiconductor"] },
  { symbol: "086520", yahooSymbol: "086520.KQ", name: "에코프로", market: "KR", aliases: ["ecopro"] },

  // US · more large caps
  { symbol: "TSM", yahooSymbol: "TSM", name: "Taiwan Semiconductor", market: "US", nameKo: "TSMC", aliases: ["tsmc", "대만반도체"] },
  { symbol: "BRK-B", yahooSymbol: "BRK-B", name: "Berkshire Hathaway", market: "US", nameKo: "버크셔해서웨이", aliases: ["berkshire"] },
  { symbol: "LLY", yahooSymbol: "LLY", name: "Eli Lilly", market: "US", nameKo: "일라이릴리" },
  { symbol: "JPM", yahooSymbol: "JPM", name: "JPMorgan Chase", market: "US", nameKo: "제이피모건", aliases: ["jp morgan"] },
  { symbol: "V", yahooSymbol: "V", name: "Visa", market: "US", nameKo: "비자" },
  { symbol: "MA", yahooSymbol: "MA", name: "Mastercard", market: "US", nameKo: "마스터카드" },
  { symbol: "WMT", yahooSymbol: "WMT", name: "Walmart", market: "US", nameKo: "월마트" },
  { symbol: "JNJ", yahooSymbol: "JNJ", name: "Johnson & Johnson", market: "US", nameKo: "존슨앤드존슨" },
  { symbol: "KO", yahooSymbol: "KO", name: "Coca-Cola", market: "US", nameKo: "코카콜라" },
  { symbol: "DIS", yahooSymbol: "DIS", name: "Walt Disney", market: "US", nameKo: "디즈니" },
  { symbol: "ORCL", yahooSymbol: "ORCL", name: "Oracle", market: "US", nameKo: "오라클" },
  { symbol: "CRM", yahooSymbol: "CRM", name: "Salesforce", market: "US", nameKo: "세일즈포스" },
  { symbol: "ADBE", yahooSymbol: "ADBE", name: "Adobe", market: "US", nameKo: "어도비" },
  { symbol: "QCOM", yahooSymbol: "QCOM", name: "Qualcomm", market: "US", nameKo: "퀄컴" },
  { symbol: "INTC", yahooSymbol: "INTC", name: "Intel", market: "US", nameKo: "인텔" },
  { symbol: "MU", yahooSymbol: "MU", name: "Micron", market: "US", nameKo: "마이크론" },
  { symbol: "ASML", yahooSymbol: "ASML", name: "ASML", market: "US", nameKo: "에이에스엠엘" },
  { symbol: "ARM", yahooSymbol: "ARM", name: "Arm Holdings", market: "US", nameKo: "암홀딩스", aliases: ["arm"] },
  { symbol: "SMCI", yahooSymbol: "SMCI", name: "Super Micro Computer", market: "US", nameKo: "슈퍼마이크로" },
  { symbol: "COIN", yahooSymbol: "COIN", name: "Coinbase", market: "US", nameKo: "코인베이스" },
  { symbol: "MSTR", yahooSymbol: "MSTR", name: "Strategy (MicroStrategy)", market: "US", nameKo: "마이크로스트래티지", aliases: ["strategy", "스트래티지"] },
  { symbol: "HOOD", yahooSymbol: "HOOD", name: "Robinhood", market: "US", nameKo: "로빈후드" },
  { symbol: "UBER", yahooSymbol: "UBER", name: "Uber", market: "US", nameKo: "우버" },
  { symbol: "ABNB", yahooSymbol: "ABNB", name: "Airbnb", market: "US", nameKo: "에어비앤비" },

  // US · broad ETFs
  { symbol: "SPY", yahooSymbol: "SPY", name: "SPDR S&P 500 ETF", market: "US", nameKo: "S&P500 ETF", aliases: ["에스앤피", "스파이", "sp500"] },
  { symbol: "QQQ", yahooSymbol: "QQQ", name: "Invesco QQQ", market: "US", nameKo: "나스닥100 ETF", aliases: ["나스닥", "큐큐큐"] },
  { symbol: "VOO", yahooSymbol: "VOO", name: "Vanguard S&P 500 ETF", market: "US", nameKo: "뱅가드 S&P500", aliases: ["에스앤피"] },
  { symbol: "VTI", yahooSymbol: "VTI", name: "Vanguard Total Stock Market ETF", market: "US", nameKo: "뱅가드 전체시장" },
  { symbol: "SCHD", yahooSymbol: "SCHD", name: "Schwab US Dividend Equity ETF", market: "US", nameKo: "슈드", aliases: ["배당", "schd"] },
  { symbol: "JEPI", yahooSymbol: "JEPI", name: "JPMorgan Equity Premium Income ETF", market: "US", nameKo: "제피", aliases: ["배당"] },
  { symbol: "DIA", yahooSymbol: "DIA", name: "SPDR Dow Jones ETF", market: "US", nameKo: "다우 ETF", aliases: ["dow", "다우존스"] },
  { symbol: "IWM", yahooSymbol: "IWM", name: "iShares Russell 2000 ETF", market: "US", nameKo: "러셀2000 ETF", aliases: ["russell"] },

  // US · leverage / inverse ETFs
  { symbol: "TQQQ", yahooSymbol: "TQQQ", name: "ProShares UltraPro QQQ", market: "US", nameKo: "나스닥100 3배", aliases: ["나스닥", "레버리지"] },
  { symbol: "SQQQ", yahooSymbol: "SQQQ", name: "ProShares UltraPro Short QQQ", market: "US", nameKo: "나스닥100 3배 인버스", aliases: ["인버스", "곱버스"] },
  { symbol: "SOXL", yahooSymbol: "SOXL", name: "Direxion Daily Semiconductor Bull 3X", market: "US", nameKo: "반도체 3배", aliases: ["반도체", "레버리지"] },
  { symbol: "SOXS", yahooSymbol: "SOXS", name: "Direxion Daily Semiconductor Bear 3X", market: "US", nameKo: "반도체 3배 인버스", aliases: ["반도체", "인버스"] },
  { symbol: "UPRO", yahooSymbol: "UPRO", name: "ProShares UltraPro S&P 500", market: "US", nameKo: "S&P500 3배", aliases: ["에스앤피", "레버리지"] },
  { symbol: "SPXL", yahooSymbol: "SPXL", name: "Direxion Daily S&P 500 Bull 3X", market: "US", nameKo: "S&P500 3배", aliases: ["에스앤피", "레버리지"] },
  { symbol: "SPXS", yahooSymbol: "SPXS", name: "Direxion Daily S&P 500 Bear 3X", market: "US", nameKo: "S&P500 3배 인버스", aliases: ["에스앤피", "인버스"] },
  { symbol: "TNA", yahooSymbol: "TNA", name: "Direxion Daily Small Cap Bull 3X", market: "US", nameKo: "러셀2000 3배", aliases: ["레버리지"] },
  { symbol: "TZA", yahooSymbol: "TZA", name: "Direxion Daily Small Cap Bear 3X", market: "US", nameKo: "러셀2000 3배 인버스", aliases: ["인버스"] },
  { symbol: "FNGU", yahooSymbol: "FNGU", name: "MicroSectors FANG+ 3X", market: "US", nameKo: "FANG+ 3배", aliases: ["팡", "레버리지"] },
  { symbol: "TECL", yahooSymbol: "TECL", name: "Direxion Daily Technology Bull 3X", market: "US", nameKo: "기술주 3배", aliases: ["레버리지"] },
  { symbol: "LABU", yahooSymbol: "LABU", name: "Direxion Daily S&P Biotech Bull 3X", market: "US", nameKo: "바이오 3배", aliases: ["바이오", "레버리지"] },
  { symbol: "TMF", yahooSymbol: "TMF", name: "Direxion Daily 20+ Year Treasury Bull 3X", market: "US", nameKo: "미국 장기채 3배", aliases: ["장기채", "미국채", "레버리지"] },
  { symbol: "TSLL", yahooSymbol: "TSLL", name: "Direxion Daily TSLA Bull 2X", market: "US", nameKo: "테슬라 2배", aliases: ["테슬라", "레버리지"] },
  { symbol: "NVDL", yahooSymbol: "NVDL", name: "GraniteShares 2x Long NVDA", market: "US", nameKo: "엔비디아 2배", aliases: ["엔비디아", "레버리지"] },
  { symbol: "CONL", yahooSymbol: "CONL", name: "GraniteShares 2x Long COIN", market: "US", nameKo: "코인베이스 2배", aliases: ["코인베이스", "레버리지"] },
  { symbol: "AAPU", yahooSymbol: "AAPU", name: "Direxion Daily AAPL Bull 2X", market: "US", nameKo: "애플 2배", aliases: ["애플", "레버리지"] },
  { symbol: "MSFU", yahooSymbol: "MSFU", name: "Direxion Daily MSFT Bull 2X", market: "US", nameKo: "마이크로소프트 2배", aliases: ["레버리지"] },
  { symbol: "AMZU", yahooSymbol: "AMZU", name: "Direxion Daily AMZN Bull 2X", market: "US", nameKo: "아마존 2배", aliases: ["아마존", "레버리지"] },
  { symbol: "GGLL", yahooSymbol: "GGLL", name: "Direxion Daily GOOGL Bull 2X", market: "US", nameKo: "구글 2배", aliases: ["구글", "레버리지"] },
  { symbol: "METU", yahooSymbol: "METU", name: "Direxion Daily META Bull 2X", market: "US", nameKo: "메타 2배", aliases: ["메타", "레버리지"] },
];

/** Full searchable universe — watchlist first, then extras. */
export const SYMBOL_CATALOG: SymbolEntry[] = [...DEFAULT_WATCHLIST, ...CATALOG_EXTRA];

export function findSymbol(symbol: string): SymbolEntry | undefined {
  const upper = symbol.toUpperCase();
  return SYMBOL_CATALOG.find(
    (s) => s.symbol === symbol || s.symbol === upper || s.yahooSymbol === symbol,
  );
}

/**
 * Typeahead search over ticker / English name / Korean name / aliases.
 * Ranks exact matches first, then prefix matches, then substring matches;
 * ties keep catalog order (watchlist & popular names surface first).
 */
export function searchSymbols(query: string, limit = 7): SymbolEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { entry: SymbolEntry; score: number }[] = [];
  for (const entry of SYMBOL_CATALOG) {
    const haystacks = [
      entry.symbol.toLowerCase(),
      entry.name.toLowerCase(),
      (entry.nameKo ?? "").toLowerCase(),
      ...(entry.aliases ?? []).map((a) => a.toLowerCase()),
    ];
    let score = Infinity;
    for (const h of haystacks) {
      if (!h) continue;
      if (h === q) score = Math.min(score, 0);
      else if (h.startsWith(q)) score = Math.min(score, 1);
      else if (h.includes(q)) score = Math.min(score, 2);
    }
    if (score < Infinity) scored.push({ entry, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
