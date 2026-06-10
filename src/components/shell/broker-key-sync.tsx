"use client";

import { useEffect } from "react";
import { PREF_KEYS, readPref } from "@/lib/preferences";

/*
  KIS API 키를 localStorage 에서 읽어 서버 라우트(`POST /api/broker/keys`)로 보내
  서버가 `HttpOnly` 쿠키로 굽도록 한다. 페이지의 다른 JS 는 이 쿠키를 못 읽어 (JS
  로는 보이지 않음) — XSS·CDN 침해 시나리오에서도 키가 새지 않는다.

  변경 감지: `usePreference` 가 발행하는 same-tab `preferences:change` + 크로스탭
  `storage`. 마지막 동기화 값과 비교해 같으면 POST 안 한다 (다른 prefs 변경 노이즈
  필터링).
*/

async function postKeys(appKey: string, appSecret: string): Promise<void> {
  try {
    await fetch("/api/broker/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appKey, appSecret }),
      credentials: "same-origin",
    });
  } catch {
    /* 네트워크 오류는 무시 — 다음 변경 이벤트에서 다시 시도된다 */
  }
}

/** Keeps server-side HttpOnly KIS cookies in sync with localStorage. Renders nothing. */
export function BrokerKeySync() {
  useEffect(() => {
    let lastKey: string | null = null;
    let lastSecret: string | null = null;

    const sync = () => {
      const k = readPref<string>(PREF_KEYS.kisAppKey, "");
      const s = readPref<string>(PREF_KEYS.kisAppSecret, "");
      if (k === lastKey && s === lastSecret) return;
      lastKey = k;
      lastSecret = s;
      void postKeys(k, s);
    };
    sync();
    window.addEventListener("preferences:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("preferences:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return null;
}
