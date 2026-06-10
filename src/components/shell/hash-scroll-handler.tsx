"use client";

import { useEffect } from "react";

/**
 * On mount, scroll to the element referenced by the URL hash (if any).
 * Falls back to the first `[data-section="<hash>"]` element if no id match,
 * so legacy `/#portfolio` style anchors keep working when groups span multiple widgets.
 */
export function HashScrollHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const id = window.setTimeout(() => {
      const el =
        document.getElementById(hash) ??
        document.querySelector<HTMLElement>(`[data-section="${hash}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
