"use client";

import { useEffect } from "react";

const OFFSET = 120;

function widgetIds(): string[] {
  const els = document.querySelectorAll<HTMLElement>("[data-widget]");
  return Array.from(els)
    .map((el) => el.getAttribute("data-widget"))
    .filter((id): id is string => Boolean(id));
}

function currentWidgetIndex(ids: string[]): number {
  const els = document.querySelectorAll<HTMLElement>("[data-widget]");
  let bestIdx = 0;
  let bestDist = Infinity;
  els.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < OFFSET) return;
    const dist = Math.abs(rect.top - OFFSET);
    if (dist < bestDist) {
      bestDist = dist;
      const id = el.getAttribute("data-widget");
      const idx = id ? ids.indexOf(id) : -1;
      if (idx !== -1) bestIdx = idx;
    }
  });
  return bestIdx;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/** Arrow/Page Up/Down jumps to previous/next widget on the page. */
export function KeyboardNavHandler() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;

      let dir: 1 | -1 | 0 = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown") dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
      else return;

      const ids = widgetIds();
      if (ids.length === 0) return;
      const idx = currentWidgetIndex(ids);
      const next = idx + dir;
      if (next < 0 || next >= ids.length) return;

      e.preventDefault();
      const target = document.getElementById(ids[next]);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
