import { cookies } from "next/headers";
import type { KisCreds } from "./kis";

// Cookie names that mirror the user's broker API keys (set client-side by
// BrokerKeySync). The keys live in localStorage; cookies are how the server —
// which renders the portfolio and proxies /api/quotes — gets to read them.
// Same-origin only (the desktop app's 127.0.0.1 server); never sent off-machine.
const KIS_KEY_COOKIE = "folio_kis_k";
const KIS_SECRET_COOKIE = "folio_kis_s";

/** Server-side: read KIS credentials from request cookies, or null if unset. */
export async function readKisCreds(): Promise<KisCreds | null> {
  const store = await cookies();
  const k = store.get(KIS_KEY_COOKIE)?.value;
  const s = store.get(KIS_SECRET_COOKIE)?.value;
  if (!k || !s) return null;
  try {
    return { appKey: decodeURIComponent(k), appSecret: decodeURIComponent(s) };
  } catch {
    return null;
  }
}

export { KIS_KEY_COOKIE, KIS_SECRET_COOKIE };
