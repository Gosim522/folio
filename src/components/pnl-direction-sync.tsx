"use client";

import { useEffect } from "react";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS, type PnlDirection } from "@/lib/preferences";

export function PnlDirectionSync() {
  const [direction] = usePreference<PnlDirection>(
    PREF_KEYS.pnlDirection,
    PREF_DEFAULTS.pnlDirection,
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-pnl-direction", direction);
  }, [direction]);
  return null;
}
