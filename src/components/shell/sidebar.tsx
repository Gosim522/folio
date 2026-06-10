"use client";

import Link from "next/link";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS, type SidebarSide } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { SettingsButton } from "./settings-button";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  const [side] = usePreference<SidebarSide>(
    PREF_KEYS.sidebarSide,
    PREF_DEFAULTS.sidebarSide,
  );
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex",
        side === "left"
          ? "border-r border-sidebar-border"
          : "border-l border-sidebar-border",
      )}
    >
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand text-brand-foreground font-bold">
            F
          </span>
          <span className="text-lg font-semibold tracking-tight">Folio</span>
        </Link>
        <SettingsButton />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-1">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          메뉴
        </div>
        <SidebarNav />
      </div>
    </aside>
  );
}
