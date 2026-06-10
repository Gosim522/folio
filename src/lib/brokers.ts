import { PREF_KEYS, readPref } from "./preferences";

export type BrokerId = "toss" | "kis";

export type BrokerDef = {
  id: BrokerId;
  /** Full display name. */
  label: string;
  /** Compact name for account selectors and badges. */
  shortLabel: string;
  /** localStorage pref key holding this broker's AppKey. */
  appKeyPref: string;
  /** localStorage pref key holding this broker's AppSecret. */
  secretPref: string;
  /** True once real quote fetching via this broker's API is wired up. */
  implemented?: boolean;
};

/**
 * Supported brokers in quote-source priority order. The first broker with both
 * API keys entered is preferred; Yahoo Finance public data is the fallback when
 * none are set. Adding a broker here surfaces its key card in 마이페이지
 * automatically (same 3-step disclosure pattern).
 */
export const BROKERS: BrokerDef[] = [
  {
    id: "toss",
    label: "토스증권 OpenAPI",
    shortLabel: "토스",
    appKeyPref: PREF_KEYS.tossAppKey,
    secretPref: PREF_KEYS.tossAppSecret,
  },
  {
    id: "kis",
    label: "한국투자증권 OpenAPI",
    shortLabel: "한국투자",
    appKeyPref: PREF_KEYS.kisAppKey,
    secretPref: PREF_KEYS.kisAppSecret,
    implemented: true,
  },
];

export const BROKER_BY_ID: Record<BrokerId, BrokerDef> = Object.fromEntries(
  BROKERS.map((b) => [b.id, b]),
) as Record<BrokerId, BrokerDef>;

/** True when both API keys for a broker are present in this browser. */
export function brokerHasKeys(broker: BrokerDef): boolean {
  return (
    readPref(broker.appKeyPref, "").length > 0 &&
    readPref(broker.secretPref, "").length > 0
  );
}

/**
 * The broker whose API should serve quotes, chosen by priority — the first
 * **implemented** broker (in BROKERS order) with both keys entered. Returns
 * null when no implemented broker is set up, meaning Yahoo Finance public data
 * is used. Client-only (reads localStorage); returns null during SSR.
 *
 * Key point: un-implemented brokers (e.g., 토스, UI 만 있고 실제 API 호출 미구현)
 * 는 우선순위에서 건너뛴다 — 그렇지 않으면 인디케이터가 "토스" 라고 나오는데
 * 실제 시세는 다른 곳(KIS·Yahoo) 에서 오는 불일치가 발생한다.
 */
export function activeBroker(): BrokerDef | null {
  for (const broker of BROKERS) {
    if (broker.implemented && brokerHasKeys(broker)) return broker;
  }
  return null;
}
