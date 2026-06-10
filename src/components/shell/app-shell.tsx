"use client";

import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS, type SidebarSide } from "@/lib/preferences";
import { cn } from "@/lib/utils";

type Props = {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
  overlays?: React.ReactNode;
};

/** Client wrapper — orientation flips based on user preference. */
export function AppShell({ sidebar, topbar, children, overlays }: Props) {
  const [side] = usePreference<SidebarSide>(
    PREF_KEYS.sidebarSide,
    PREF_DEFAULTS.sidebarSide,
  );
  return (
    <div
      className={cn(
        "flex min-h-dvh",
        side === "right" && "flex-row-reverse",
      )}
    >
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar}
        <main className="flex-1 px-6 md:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      {overlays}
    </div>
  );
}
