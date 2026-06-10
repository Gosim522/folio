import type { Market } from "@/lib/quotes/types";

export type AlertDirection = "above" | "below";

export type PriceAlert = {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  direction: AlertDirection;
  /** 목표 가격 — 시장 통화 (KR: KRW, US: USD). */
  targetPrice: number;
  createdAt: string;
  /** 발동된 경우 ISO datetime. 미발동이면 undefined. */
  triggeredAt?: string;
};

export function newAlertId(): string {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** 단일 알림이 조건을 충족하는지 — current 는 시장 통화의 현재가. */
export function alertHits(alert: PriceAlert, current: number): boolean {
  if (alert.triggeredAt) return false; // 이미 발동된 건 다시 발동 안 함
  if (!Number.isFinite(current) || current <= 0) return false;
  return alert.direction === "above"
    ? current >= alert.targetPrice
    : current <= alert.targetPrice;
}
