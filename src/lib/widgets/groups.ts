import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  FlaskConical,
  Globe,
  LayoutDashboard,
  LayoutGrid,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { WIDGETS } from "./registry";
import type { GroupDef, WidgetId } from "./types";

export const DEFAULT_GROUP_ORDER = [
  "overview",
  "holdings",
  "pnl",
  "trades",
  "paper",
  "quotes",
  "market",
  "journal",
] as const;

export const GROUP_META: Record<string, { label: string; icon: LucideIcon }> = {
  overview: { label: "요약", icon: LayoutDashboard },
  holdings: { label: "보유 종목", icon: Wallet },
  pnl: { label: "손익 분석", icon: TrendingUp },
  trades: { label: "거래 기록", icon: ArrowLeftRight },
  paper: { label: "모의 투자", icon: FlaskConical },
  quotes: { label: "시세", icon: Activity },
  market: { label: "시장 동향", icon: Globe },
  journal: { label: "매매일지", icon: BookOpen },
};

export function defaultGroups(): GroupDef[] {
  const buckets = new Map<string, WidgetId[]>();
  for (const w of WIDGETS) {
    const list = buckets.get(w.defaultGroup) ?? [];
    list.push(w.id);
    buckets.set(w.defaultGroup, list);
  }
  return DEFAULT_GROUP_ORDER.map((id) => ({
    id,
    label: GROUP_META[id].label,
    widgets: buckets.get(id) ?? [],
    builtin: true,
  }));
}

export const DEFAULT_WIDGET_ORDER: WidgetId[] = DEFAULT_GROUP_ORDER.flatMap(
  (gid) => WIDGETS.filter((w) => w.defaultGroup === gid).map((w) => w.id),
);

export function iconForGroup(groupId: string): LucideIcon {
  return GROUP_META[groupId]?.icon ?? LayoutGrid;
}

export function labelForGroup(groupId: string, groups: GroupDef[]): string {
  const found = groups.find((g) => g.id === groupId);
  if (found) return found.label;
  return GROUP_META[groupId]?.label ?? groupId;
}
