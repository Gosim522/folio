"use client";

import { useEffect, useState } from "react";

/**
 * Returns the widget id closest to the top of the viewport.
 * Same shape as useActiveSection, but queries `[data-widget]` elements.
 */
export function useActiveWidget(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let raf: number | null = null;
    const SCROLL_OFFSET = 120;

    function compute() {
      const els = document.querySelectorAll<HTMLElement>("[data-widget]");
      if (els.length === 0) return;
      let bestId: string | null = null;
      let bestDist = Infinity;
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < SCROLL_OFFSET) continue;
        const dist = Math.abs(rect.top - SCROLL_OFFSET);
        if (dist < bestDist) {
          bestDist = dist;
          const id = el.getAttribute("data-widget");
          if (id) bestId = id;
        }
      }
      setActive((prev) => (prev === bestId ? prev : bestId));
    }

    function onScroll() {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        compute();
        raf = null;
      });
    }

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return active;
}
