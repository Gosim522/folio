import { type KisCreds, fetchManyKisQuotes } from "./kis";
import type { Quote, SymbolEntry } from "./types";
import { fetchManyYahooQuotes } from "./yahoo";

/**
 * Unified quote fetch. When KIS credentials are present, KR stocks are priced
 * via the 한국투자증권 OpenAPI; US stocks (and any KR symbol KIS couldn't
 * return) fall back to Yahoo. Without creds, everything uses Yahoo.
 */
export async function fetchQuotes(
  entries: SymbolEntry[],
  kisCreds?: KisCreds | null,
): Promise<Quote[]> {
  if (!kisCreds) return fetchManyYahooQuotes(entries);

  const kr = entries.filter((e) => e.market === "KR");
  const kisQuotes = await fetchManyKisQuotes(kr, kisCreds);
  const covered = new Set(kisQuotes.map((q) => q.symbol));

  // Everything KIS didn't price (US + any KR miss) goes to Yahoo.
  const viaYahoo = entries.filter((e) => !covered.has(e.symbol));
  const yahooQuotes = await fetchManyYahooQuotes(viaYahoo);

  return [...kisQuotes, ...yahooQuotes];
}
