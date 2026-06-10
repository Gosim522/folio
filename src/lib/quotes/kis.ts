import type { Quote, SymbolEntry } from "./types";

// 한국투자증권(KIS) OpenAPI — 국내주식 실시간 시세.
// 미국주식 실시간은 별도 유료 신청이 필요하므로 KR 종목만 KIS로 처리하고,
// 그 외(US)·실패분은 호출부가 Yahoo로 폴백한다.
const KIS_BASE = "https://openapi.koreainvestment.com:9443";

export type KisCreds = { appKey: string; appSecret: string };

// OAuth 토큰 캐시 — appKey별. KIS는 토큰 발급을 1분당 1회로 제한하지만 토큰은
// 24시간 유효하므로, 만료 전까지 메모리에 보관해 재사용한다. 동시 요청이
// 몰릴 때 토큰을 중복 발급하지 않도록 in-flight 프라미스도 공유한다.
type CachedToken = { token: string; expiresAt: number };
const tokenCache = new Map<string, CachedToken>();
const tokenInflight = new Map<string, Promise<string | null>>();

async function getToken(creds: KisCreds): Promise<string | null> {
  const cached = tokenCache.get(creds.appKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const existing = tokenInflight.get(creds.appKey);
  if (existing) return existing;

  const inflight = (async (): Promise<string | null> => {
    try {
      const res = await fetch(`${KIS_BASE}/oauth2/tokenP`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          appkey: creds.appKey,
          appsecret: creds.appSecret,
        }),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
      };
      if (!json.access_token) return null;
      tokenCache.set(creds.appKey, {
        token: json.access_token,
        expiresAt: Date.now() + (json.expires_in ?? 86400) * 1000,
      });
      return json.access_token;
    } catch {
      return null;
    } finally {
      tokenInflight.delete(creds.appKey);
    }
  })();
  tokenInflight.set(creds.appKey, inflight);
  return inflight;
}

/** Single KR-stock quote from KIS. Returns null for US / on any failure. */
export async function fetchKisQuote(
  entry: SymbolEntry,
  creds: KisCreds,
): Promise<Quote | null> {
  if (entry.market !== "KR") return null;
  const token = await getToken(creds);
  if (!token) return null;
  try {
    const url = new URL(
      `${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-price`,
    );
    url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
    url.searchParams.set("FID_INPUT_ISCD", entry.symbol);
    const res = await fetch(url, {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        appkey: creds.appKey,
        appsecret: creds.appSecret,
        tr_id: "FHKST01010100",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      rt_cd?: string;
      output?: Record<string, string>;
    };
    const o = json.output;
    if (json.rt_cd !== "0" || !o) return null;
    const price = Number(o.stck_prpr);
    if (!Number.isFinite(price) || price <= 0) return null;
    return {
      ...entry,
      currency: "KRW",
      price,
      previousClose: Number(o.stck_sdpr) || price,
      dayHigh: Number(o.stck_hgpr) || price,
      dayLow: Number(o.stck_lwpr) || price,
      volume: Number(o.acml_vol) || 0,
      changeAbs: Number(o.prdy_vrss) || 0,
      changeRate: Number(o.prdy_ctrt) || 0,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/** Fetch many KR quotes from KIS in small batches (respects KIS rate limits). */
export async function fetchManyKisQuotes(
  entries: SymbolEntry[],
  creds: KisCreds,
): Promise<Quote[]> {
  const kr = entries.filter((e) => e.market === "KR");
  if (kr.length === 0) return [];
  // Warm the token once so the batch doesn't race on issuance.
  if (!(await getToken(creds))) return [];

  const out: Quote[] = [];
  const BATCH = 5;
  for (let i = 0; i < kr.length; i += BATCH) {
    const slice = kr.slice(i, i + BATCH);
    const quotes = await Promise.all(
      slice.map((e) => fetchKisQuote(e, creds)),
    );
    for (const q of quotes) if (q) out.push(q);
  }
  return out;
}
