import type { Trade } from "./portfolio/types";
import { DEFAULT_WIDGET_ORDER, defaultGroups } from "./widgets/groups";
import type { GroupDef, WidgetId } from "./widgets/types";

export const PREF_PREFIX = "pref:";

export type PnlDirection = "western" | "eastern";
export type SidebarSide = "left" | "right";
export type PaperSort =
  | "loss"
  | "gain"
  | "value"
  | "quantity"
  | "name"
  | "custom";

export const PREF_KEYS = {
  pnlDirection: "global.pnlColorDirection",
  /** Auto-refresh interval in seconds. 0 = off (manual only). */
  refreshInterval: "global.refreshInterval",
  /** Layout density — "comfortable" | "compact". */
  density: "global.density",
  portfolioBasis: "portfolio.basis",
  portfolioSort: "portfolio.holdingsSort",
  sidebarSide: "layout.sidebarSide",
  /** @deprecated use widgetOrder. Kept as migration source only. */
  sectionOrder: "layout.sectionOrder",
  /** @deprecated use hiddenWidgets. Kept as migration source only. */
  hiddenSections: "layout.hiddenSections",
  widgetOrder: "layout.widgetOrder",
  hiddenWidgets: "layout.hiddenWidgets",
  widgetGroups: "layout.widgetGroups",
  expandedGroups: "layout.expandedGroups",
  /** Bumped when the built-in category scheme changes — triggers a one-time reset. */
  widgetSchemaVersion: "layout.widgetSchemaVersion",
  userDisplayName: "user.displayName",
  tossAppKey: "user.toss.appKey",
  tossAppSecret: "user.toss.appSecret",
  kisAppKey: "user.kis.appKey",
  kisAppSecret: "user.kis.appSecret",
  /** Paper-trading sandbox trades — separate from the real SAMPLE_TRADES feed. */
  paperTrades: "paper.trades",
  /** Sort order for the 모의 투자 holdings list. */
  paperSort: "paper.holdingsSort",
  /** Manual drag order (symbols) for the 모의 투자 holdings list. */
  paperOrder: "paper.holdingsOrder",
  /** Journal entries (매매일지) — list of user-written reflections, persisted locally. */
  journalEntries: "journal.entries",
  /** 가격 알림 목록 — 종목별 상회/하회 타겟. */
  priceAlerts: "alerts.priceAlerts",
} as const;

export const DEFAULT_SECTION_ORDER = [
  "overview",
  "holdings",
  "pnl",
  "trades",
  "paper",
  "quotes",
  "market",
  "journal",
] as const;

export type Density = "comfortable" | "compact";

export const PREF_DEFAULTS = {
  pnlDirection: "western" as PnlDirection,
  refreshInterval: 60,
  density: "comfortable" as Density,
  sidebarSide: "left" as SidebarSide,
  sectionOrder: [...DEFAULT_SECTION_ORDER] as string[],
  hiddenSections: [] as string[],
  widgetOrder: [...DEFAULT_WIDGET_ORDER] as WidgetId[],
  // Recommended starter layout — 11 widgets visible, the rest hidden but
  // discoverable (with a preview) under 설정 → 위젯.
  hiddenWidgets: [
    "holdings-preview",
    "market-breakdown",
    "tax-card",
    "trade-list",
    "trade-calendar",
    "buy-sell-ratio",
    "activity-chart",
    "market-clock",
    "market-heatmap",
    "sector-performance",
    "economic-calendar",
    "journal",
    "journal-prompts",
  ] as WidgetId[],
  widgetGroups: defaultGroups() as GroupDef[],
  expandedGroups: [...DEFAULT_SECTION_ORDER] as string[],
  paperTrades: [] as Trade[],
  paperSort: "loss" as PaperSort,
  paperOrder: [] as string[],
};

/** Bump when the built-in category scheme / recommended layout changes. */
export const WIDGET_SCHEMA_VERSION = 7;

export function readPref<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREF_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writePref<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
    // Defer the dispatch so subscribers' setValue calls don't run during another
    // component's render phase (React 19 flags that as "setState in render").
    queueMicrotask(() => {
      window.dispatchEvent(
        new CustomEvent("preferences:change", { detail: { key } }),
      );
    });
  } catch {
    /* swallow */
  }
}

/**
 * Resets widget layout prefs (groups / order / hidden / expanded) to the current
 * recommended scheme when the stored schema version is behind. Runs once per
 * version bump — used when the built-in category layout changes. Safe to call on
 * every load; a no-op once the user is on the latest version.
 */
export function migrateWidgetSchema() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(
      PREF_PREFIX + PREF_KEYS.widgetSchemaVersion,
    );
    const version = raw ? (JSON.parse(raw) as number) : 1;
    if (version >= WIDGET_SCHEMA_VERSION) return;
    writePref(PREF_KEYS.widgetGroups, PREF_DEFAULTS.widgetGroups);
    writePref(PREF_KEYS.widgetOrder, PREF_DEFAULTS.widgetOrder);
    writePref(PREF_KEYS.hiddenWidgets, PREF_DEFAULTS.hiddenWidgets);
    writePref(PREF_KEYS.expandedGroups, PREF_DEFAULTS.expandedGroups);
    writePref(PREF_KEYS.widgetSchemaVersion, WIDGET_SCHEMA_VERSION);
  } catch {
    /* swallow */
  }
}
