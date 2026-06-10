import { NextResponse } from "next/server";
import { readKisCreds } from "@/lib/quotes/broker-creds";
import { fetchQuotes } from "@/lib/quotes/provider";
import { DEFAULT_WATCHLIST, findSymbol } from "@/lib/quotes/symbols";
import type { SymbolEntry } from "@/lib/quotes/types";

export const dynamic = "force-dynamic";

/** Treats an unknown symbol as a raw Yahoo symbol (paper-trading searches the
 *  full Yahoo universe, beyond the curated SYMBOL_CATALOG). */
function rawEntry(symbol: string): SymbolEntry {
  const market =
    symbol.endsWith(".KS") || symbol.endsWith(".KQ") ? "KR" : "US";
  return { symbol, yahooSymbol: symbol, name: symbol, market };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get("symbols");

  let entries: SymbolEntry[] = DEFAULT_WATCHLIST;
  if (symbolsParam) {
    entries = symbolsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => findSymbol(s) ?? rawEntry(s));
  }

  // KR quotes via 한국투자증권 when the user has KIS keys; Yahoo otherwise.
  const kisCreds = await readKisCreds();
  const quotes = await fetchQuotes(entries, kisCreds);

  return NextResponse.json(
    { quotes, fetchedAt: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
