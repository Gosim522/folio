import { NextResponse } from "next/server";
import type { Market, SymbolEntry } from "@/lib/quotes/types";

export const dynamic = "force-dynamic";

// Yahoo blocks requests with the default fetch UA — present as a browser.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

type YahooSearchQuote = {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
};

/** Maps a Yahoo symbol to a supported market, or null if unsupported. */
function marketOf(symbol: string): Market | null {
  if (symbol.endsWith(".KS") || symbol.endsWith(".KQ")) return "KR";
  if (!symbol.includes(".")) return "US"; // plain ticker — US listing
  return null; // .L / .T / other exchanges — not supported by the engine
}

/**
 * Free-text symbol search across the whole Yahoo Finance universe — used by the
 * 모의 투자 widget so the user isn't limited to the curated SYMBOL_CATALOG.
 * Results are restricted to KR/US stocks & ETFs (the markets the portfolio
 * engine can price).
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  try {
    const url =
      `https://query1.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0&listsCount=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ results: [] });

    const json = (await res.json()) as { quotes?: YahooSearchQuote[] };
    const seen = new Set<string>();
    const results: SymbolEntry[] = [];
    for (const item of json.quotes ?? []) {
      const symbol = item.symbol;
      if (!symbol || seen.has(symbol)) continue;
      if (item.quoteType !== "EQUITY" && item.quoteType !== "ETF") continue;
      const market = marketOf(symbol);
      if (!market) continue;
      seen.add(symbol);
      results.push({
        symbol,
        yahooSymbol: symbol,
        name: item.longname || item.shortname || symbol,
        market,
      });
    }
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ results: [] });
  }
}
