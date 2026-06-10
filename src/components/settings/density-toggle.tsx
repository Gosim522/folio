"use client";

import { Rows3, Rows4 } from "lucide-react";
import { PillGroup } from "@/components/common/pill-group";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS, type Density } from "@/lib/preferences";

const OPTIONS = [
  { value: "comfortable" as const, label: "보통" },
  { value: "compact" as const, label: "밀집" },
];

/** Density toggle — compact mode shrinks the whole UI for narrow side monitors. */
export function DensityToggle() {
  const [density, setDensity] = usePreference<Density>(
    PREF_KEYS.density,
    PREF_DEFAULTS.density,
  );
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        {density === "compact" ? (
          <Rows4 className="size-4 text-muted-foreground" strokeWidth={1.8} />
        ) : (
          <Rows3 className="size-4 text-muted-foreground" strokeWidth={1.8} />
        )}
        <span className="font-medium">화면 밀도</span>
      </div>
      <PillGroup
        ariaLabel="화면 밀도"
        value={density}
        onChange={setDensity}
        options={OPTIONS}
      />
    </div>
  );
}
