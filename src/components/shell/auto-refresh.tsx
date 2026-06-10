"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS } from "@/lib/preferences";

/**
 * Periodically re-runs the server render via router.refresh() so server-rendered
 * widgets (portfolio, strip, sector returns…) pick up fresh quotes without a
 * manual page reload. Client state (widget order, drag, prefs) is preserved.
 *
 * Interval is user-configurable (설정 → 갱신 주기). 0 = off / manual only.
 * Skips refreshing while the tab is hidden; refreshes once on regaining focus.
 */
export function AutoRefresh() {
  const router = useRouter();
  const [intervalSec] = usePreference<number>(
    PREF_KEYS.refreshInterval,
    PREF_DEFAULTS.refreshInterval,
  );

  useEffect(() => {
    function refreshIfVisible() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    // Always refresh when the tab regains focus, regardless of interval.
    document.addEventListener("visibilitychange", refreshIfVisible);

    let id: number | undefined;
    if (intervalSec > 0) {
      id = window.setInterval(refreshIfVisible, intervalSec * 1000);
    }

    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      if (id !== undefined) window.clearInterval(id);
    };
  }, [router, intervalSec]);

  return null;
}
