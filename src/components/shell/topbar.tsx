"use client";

import { Suspense } from "react";
import { useActiveSection } from "@/hooks/use-active-section";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS } from "@/lib/preferences";
import { APP_VERSION } from "@/lib/version";
import { labelForGroup } from "@/lib/widgets/groups";
import type { GroupDef } from "@/lib/widgets/types";
import { AccountSelector } from "./account-selector";

export function Topbar() {
  const active = useActiveSection();
  const [groups] = usePreference<GroupDef[]>(
    PREF_KEYS.widgetGroups,
    PREF_DEFAULTS.widgetGroups,
  );
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Folio
          <span
            className="rounded-md bg-muted px-1.5 py-px font-mono text-[10px] tracking-tight text-foreground/70"
            title={`현재 설치된 Folio 버전: v${APP_VERSION}`}
          >
            v{APP_VERSION}
          </span>
        </span>
        <h1 className="text-base font-semibold tracking-tight">
          {labelForGroup(active, groups)}
        </h1>
      </div>
      <Suspense fallback={null}>
        <AccountSelector />
      </Suspense>
    </header>
  );
}
