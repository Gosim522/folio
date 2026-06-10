"use client";

import { useSyncExternalStore } from "react";

export type ChartTokens = {
  brand: string;
  pos: string;
  neg: string;
  grid: string;
  axis: string;
  surface: string;
  text: string;
  palette: string[];
};

const FALLBACK_PALETTE = [
  "oklch(0.62 0.18 252)",
  "oklch(0.68 0.16 175)",
  "oklch(0.7 0.17 60)",
  "oklch(0.65 0.2 320)",
  "oklch(0.7 0.18 145)",
];

const FALLBACK: ChartTokens = {
  brand: "oklch(0.6 0.18 252)",
  pos: "oklch(0.62 0.16 145)",
  neg: "oklch(0.6 0.22 27)",
  grid: "oklch(0.92 0 0)",
  axis: "oklch(0.52 0 0)",
  surface: "oklch(1 0 0)",
  text: "oklch(0.18 0 0)",
  palette: FALLBACK_PALETTE,
};

function readTokens(): ChartTokens {
  if (typeof window === "undefined") return FALLBACK;
  const s = getComputedStyle(document.documentElement);
  const read = (name: string, fb: string) =>
    s.getPropertyValue(name).trim() || fb;
  const palette = [1, 2, 3, 4, 5].map((i) =>
    read(`--chart-${i}`, FALLBACK_PALETTE[i - 1]),
  );
  return {
    brand: read("--brand", FALLBACK.brand),
    pos: read("--pos", FALLBACK.pos),
    neg: read("--neg", FALLBACK.neg),
    grid: read("--border", FALLBACK.grid),
    axis: read("--muted-foreground", FALLBACK.axis),
    surface: read("--card", FALLBACK.surface),
    text: read("--foreground", FALLBACK.text),
    palette,
  };
}

/*
  공유 상태 — 한 번만 MutationObserver 를 달고 모든 구독자에게 알린다.
  cachedTokens 는 안정 참조 캐시 (변화 없으면 같은 객체) — useSyncExternalStore 가
  무한 재렌더 안 일으키게 하는 필수 조건.
*/
let cachedTokens: ChartTokens = FALLBACK;
let cacheDirty = true;
const tokenListeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function notifyTokenListeners() {
  cacheDirty = true;
  for (const l of tokenListeners) l();
}

function ensureTokenObserver() {
  if (observer || typeof window === "undefined") return;
  observer = new MutationObserver(notifyTokenListeners);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-pnl-direction"],
  });
}

function subscribeTokens(cb: () => void): () => void {
  ensureTokenObserver();
  tokenListeners.add(cb);
  return () => {
    tokenListeners.delete(cb);
    if (tokenListeners.size === 0 && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

function getTokens(): ChartTokens {
  if (typeof window === "undefined") return FALLBACK;
  if (cacheDirty) {
    cachedTokens = readTokens();
    cacheDirty = false;
  }
  return cachedTokens;
}

/** Reads design tokens off <html> and re-resolves on theme / pnl-direction changes. */
export function useChartTokens(): ChartTokens {
  return useSyncExternalStore(subscribeTokens, getTokens, () => FALLBACK);
}
