"use client";

import { useEffect, useState } from "react";

/*
  브라우저처럼 Ctrl+휠 / Ctrl+`+`/`-` / Ctrl+`0` 으로 앱 전체를 확대·축소.

  데스크톱(Electron) 에서는 `webFrame.setZoomFactor()` (preload 의 folioDesktop 브리지
  를 통해) 를 호출해 Chromium 의 네이티브 줌을 쓴다 — sticky·flex·max-width 레이아웃을
  망가뜨리지 않는다. 브라우저 환경에서는 fallback 으로 <main> 의 CSS `zoom` 을 쓴다.

  zoom 레벨은 localStorage 에 저장돼 다음 실행에 복원되며, 변경 시 우상단에 잠시
  "125%" 같은 인디케이터를 띄운다.
*/

const ZOOM_LEVELS = [0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];
const DEFAULT_ZOOM = 1.0;
const STORAGE_KEY = "pref:layout.appZoom";
const INDICATOR_TTL_MS = 1100;

type Desktop = {
  setZoomFactor?: (factor: number) => void;
  getZoomFactor?: () => number;
};

function desktop(): Desktop | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { folioDesktop?: Desktop };
  return w.folioDesktop ?? null;
}

function applyZoom(level: number) {
  const d = desktop();
  if (d?.setZoomFactor) {
    // 네이티브 — 깔끔, 레이아웃 안 깨짐.
    d.setZoomFactor(level);
    return;
  }
  // 브라우저 폴백: <main> 만 CSS zoom (sidebar/topbar 는 그대로).
  if (typeof document === "undefined") return;
  const target = document.querySelector<HTMLElement>("main");
  if (!target) return;
  (target.style as unknown as { zoom: string }).zoom = String(level);
}

function readSavedZoom(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ZOOM;
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) return DEFAULT_ZOOM;
    return v;
  } catch {
    return DEFAULT_ZOOM;
  }
}

function saveZoom(level: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(level));
  } catch {
    /* ignore */
  }
}

function nearestIndex(level: number): number {
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < ZOOM_LEVELS.length; i++) {
    const d = Math.abs(ZOOM_LEVELS[i] - level);
    if (d < bestDiff) {
      bestDiff = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function AppZoomHandler() {
  const [indicator, setIndicator] = useState<number | null>(null);

  useEffect(() => {
    let current = readSavedZoom();
    applyZoom(current);

    let indicatorTimer: ReturnType<typeof setTimeout> | null = null;
    const flashIndicator = (level: number) => {
      setIndicator(level);
      if (indicatorTimer) clearTimeout(indicatorTimer);
      indicatorTimer = setTimeout(() => setIndicator(null), INDICATOR_TTL_MS);
    };

    const setLevel = (level: number) => {
      current = level;
      applyZoom(current);
      saveZoom(current);
      flashIndicator(current);
    };

    const step = (dir: 1 | -1) => {
      const idx = nearestIndex(current);
      const nextIdx = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx + dir));
      if (ZOOM_LEVELS[nextIdx] !== current) setLevel(ZOOM_LEVELS[nextIdx]);
    };

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      step(e.deltaY > 0 ? -1 : 1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
        e.preventDefault();
        step(1);
      } else if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "0" || e.code === "Numpad0") {
        e.preventDefault();
        setLevel(DEFAULT_ZOOM);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      if (indicatorTimer) clearTimeout(indicatorTimer);
    };
  }, []);

  if (indicator === null) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-50 select-none rounded-full border border-border bg-background/95 px-3 py-1.5 text-sm font-semibold tabular shadow-floating backdrop-blur"
    >
      {Math.round(indicator * 100)}%
    </div>
  );
}
