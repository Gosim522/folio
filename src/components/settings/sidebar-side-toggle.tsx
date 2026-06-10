"use client";

import { PanelLeft, PanelRight } from "lucide-react";
import { PillGroup } from "@/components/common/pill-group";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS, type SidebarSide } from "@/lib/preferences";

const OPTIONS = [
  { value: "left" as const, label: "왼쪽" },
  { value: "right" as const, label: "오른쪽" },
];

export function SidebarSideToggle() {
  const [side, setSide] = usePreference<SidebarSide>(
    PREF_KEYS.sidebarSide,
    PREF_DEFAULTS.sidebarSide,
  );
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        {side === "left" ? (
          <PanelLeft className="size-4 text-muted-foreground" strokeWidth={1.8} />
        ) : (
          <PanelRight className="size-4 text-muted-foreground" strokeWidth={1.8} />
        )}
        <span className="font-medium">사이드바 위치</span>
      </div>
      <PillGroup
        ariaLabel="사이드바 위치"
        value={side}
        onChange={setSide}
        options={OPTIONS}
      />
    </div>
  );
}
