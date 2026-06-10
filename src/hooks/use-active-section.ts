"use client";

import { useSyncExternalStore } from "react";

/*
  현재 뷰포트에서 가장 위에 보이는 섹션의 id 를 추적한다. 스크롤·리사이즈에 rAF 로
  스로틀된다.

  설계 노트 — 왜 공유 모듈 상태인가:
  - "지금 활성 섹션" 은 본질적으로 페이지 전체에 하나뿐인 값 (Topbar 와 SidebarNav
    가 같은 답을 본다). 컴포넌트마다 별도 스크롤 리스너·rAF 를 두는 것은 낭비.
  - useSyncExternalStore 는 외부 저장소 1개를 여러 구독자가 보는 모델과 정확히 맞물림.
*/

const SCROLL_OFFSET = 120; // px below viewport top

let currentActive = "overview";
let raf: number | null = null;
let attached = false;
const listeners = new Set<() => void>();

function compute(): string {
  if (typeof document === "undefined") return currentActive;
  const sections = document.querySelectorAll<HTMLElement>("[data-section]");
  if (sections.length === 0) return currentActive;
  let bestId = currentActive;
  let bestDist = Infinity;
  for (const el of sections) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < SCROLL_OFFSET) continue; // entirely above
    const dist = Math.abs(rect.top - SCROLL_OFFSET);
    if (dist < bestDist) {
      bestDist = dist;
      const id = el.getAttribute("data-section");
      if (id) bestId = id;
    }
  }
  return bestId;
}

function tick() {
  const next = compute();
  if (next === currentActive) return;
  currentActive = next;
  if (typeof window !== "undefined") {
    const desired = `#${next}`;
    if (window.location.hash !== desired) {
      window.history.replaceState(null, "", desired);
    }
  }
  for (const l of listeners) l();
}

function onScroll() {
  if (raf !== null) return;
  raf = requestAnimationFrame(() => {
    tick();
    raf = null;
  });
}

function ensureAttached() {
  if (attached || typeof window === "undefined") return;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  attached = true;
  tick(); // 첫 계산
}

function subscribeActiveSection(cb: () => void): () => void {
  ensureAttached();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && attached) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      attached = false;
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }
  };
}

function getActiveSection(): string {
  return currentActive;
}

/**
 * 현재 활성 섹션 id (스크롤 위치 기반).
 *
 * defaultId 는 SSR 스냅샷·아직 스크롤 한 번 안 한 초기값으로만 쓰임. 첫 구독 시
 * `subscribeActiveSection` 가 `ensureAttached` → `tick()` 를 호출해 즉시 DOM 으로
 * 부터 진짜 값을 계산하고 알림 → 클라이언트 첫 렌더 직후 정확한 값으로 갱신됨.
 */
export function useActiveSection(defaultId = "overview"): string {
  return useSyncExternalStore(
    subscribeActiveSection,
    getActiveSection,
    () => defaultId,
  );
}
