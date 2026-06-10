"use client";

import { useEffect } from "react";

/*
  앱 전역 단축키 — 줌·섹션 네비·도움말 외 추가 단축키.

  - `/` : 거래 검색 input 에 포커스 (`[data-shortcut="trade-search"]` 선택자)

  입력 필드에서 타이핑 중이면 모두 건너뜀.
  (v0.21 부터 정보 제공 전용 — 거래 직접 추가 경로가 제거돼 `n` 단축키도 함께 제거됨.)
*/

function isTypingTarget(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null;
  if (!t) return false;
  if (
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    t.isContentEditable
  )
    return true;
  return false;
}

export function AppShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === "/") {
        const input = document.querySelector<HTMLInputElement>(
          '[data-shortcut="trade-search"]',
        );
        if (input) {
          e.preventDefault();
          input.focus();
          input.select?.();
          input.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
