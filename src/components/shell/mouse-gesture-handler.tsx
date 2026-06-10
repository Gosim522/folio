"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Vertical movement (px) a right-drag must clear to count as a gesture. */
const THRESHOLD = 60;

type Direction = "top" | "bottom";

/**
 * Naver-Whale-style mouse gesture: hold the right mouse button and drag —
 * drag up jumps to the top of the page, drag down jumps to the bottom.
 * The browser context menu is suppressed only when a gesture actually fired,
 * so a plain right-click still opens the menu as usual.
 */
export function MouseGestureHandler() {
  const [hint, setHint] = useState<Direction | null>(null);
  const hintRef = useRef<Direction | null>(null);

  useEffect(() => {
    let tracking = false;
    let startX = 0;
    let startY = 0;
    let direction: Direction | null = null;
    let suppressNextMenu = false;

    const applyHint = (next: Direction | null) => {
      if (hintRef.current === next) return;
      hintRef.current = next;
      setHint(next);
    };

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 2) return;
      tracking = true;
      direction = null;
      startX = e.clientX;
      startY = e.clientY;
    }

    function onMouseMove(e: MouseEvent) {
      if (!tracking) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // Must clear the threshold and be mostly vertical.
      if (Math.abs(dy) >= THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
        direction = dy < 0 ? "top" : "bottom";
      } else {
        direction = null;
      }
      applyHint(direction);
    }

    function onMouseUp(e: MouseEvent) {
      if (e.button !== 2 || !tracking) return;
      tracking = false;
      if (direction) {
        suppressNextMenu = true;
        window.scrollTo({
          top: direction === "top" ? 0 : document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      }
      direction = null;
      applyHint(null);
    }

    function onContextMenu(e: MouseEvent) {
      if (suppressNextMenu) {
        e.preventDefault();
        suppressNextMenu = false;
      }
    }

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  if (!hint) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
      <div className="flex items-center gap-2 rounded-full bg-foreground/90 px-4 py-2 text-sm font-medium text-background shadow-lg">
        {hint === "top" ? (
          <ArrowUp className="size-4" strokeWidth={2.4} />
        ) : (
          <ArrowDown className="size-4" strokeWidth={2.4} />
        )}
        {hint === "top" ? "맨 위로" : "맨 아래로"}
      </div>
    </div>
  );
}
