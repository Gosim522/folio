"use client";

import { useEffect } from "react";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS, type Density } from "@/lib/preferences";

/** Mirrors the density preference to `data-density` on <html> for CSS to read. */
export function DensitySync() {
  const [density] = usePreference<Density>(
    PREF_KEYS.density,
    PREF_DEFAULTS.density,
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);
  return null;
}
