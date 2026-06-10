"use client";

import { useEffect } from "react";
import { usePreference } from "@/hooks/use-preferences";
import { alertHits, type PriceAlert } from "@/lib/alerts/types";
import { PREF_KEYS } from "@/lib/preferences";

/*
  가격 알림 워처. 30 초마다 활성(미발동) 알림의 종목 시세를 가져와 조건 충족 여부를
  검사. 충족 시:
  - 알림에 triggeredAt 기록 (영구 — 사용자가 명시적으로 지울 때까지 다시 안 울림)
  - 데스크톱 알림 (브라우저 Notification API — Electron 도 동일 지원)
  - 인앱 토스트용 커스텀 이벤트 `folio:alert-triggered` 디스패치

  렌더 없음 — 사이드 이펙트만 다루는 컴포넌트.
*/

const POLL_MS = 30_000;

type QuoteLite = { symbol: string; price: number };

async function fetchPrices(symbols: string[]): Promise<QuoteLite[]> {
  if (symbols.length === 0) return [];
  try {
    const res = await fetch(
      `/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { symbol: string; price: number }[];
    return data;
  } catch {
    return [];
  }
}

function notify(alert: PriceAlert, current: number) {
  // 인앱 토스트
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("folio:alert-triggered", {
        detail: { alert, current },
      }),
    );
  }
  // 데스크톱 알림 (권한 있을 때만)
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const dir = alert.direction === "above" ? "상회" : "하회";
    const body = `현재 ${current.toLocaleString("ko-KR")} (목표 ${alert.targetPrice.toLocaleString("ko-KR")} ${dir})`;
    try {
      new Notification(`Folio · ${alert.name} ${dir}`, { body });
    } catch {
      /* ignore */
    }
  }
}

export function PriceAlertWatcher() {
  const [alerts, setAlerts] = usePreference<PriceAlert[]>(
    PREF_KEYS.priceAlerts,
    [],
  );

  useEffect(() => {
    // 권한 요청은 알림이 하나라도 활성일 때만 — 사용자 첫 인상이 좋게.
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default" &&
      alerts.some((a) => !a.triggeredAt)
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, [alerts]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const active = alerts.filter((a) => !a.triggeredAt);
      if (active.length === 0) return;
      const symbols = Array.from(new Set(active.map((a) => a.symbol)));
      const prices = await fetchPrices(symbols);
      if (cancelled) return;
      const priceMap = new Map(prices.map((p) => [p.symbol, p.price]));

      let changed = false;
      const updated = alerts.map((a) => {
        if (a.triggeredAt) return a;
        const current = priceMap.get(a.symbol);
        if (current === undefined) return a;
        if (alertHits(a, current)) {
          notify(a, current);
          changed = true;
          return { ...a, triggeredAt: new Date().toISOString() };
        }
        return a;
      });
      if (changed) setAlerts(updated);
    };

    // 첫 체크는 즉시, 그 다음은 interval.
    check();
    const id = window.setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // alerts 의존성에 따라 매 변경 시 새 interval — usePreference 가 안정 ref 캐시.
  }, [alerts, setAlerts]);

  return null;
}
