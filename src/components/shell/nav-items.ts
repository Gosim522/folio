import {
  Activity,
  BookOpen,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  ListOrdered,
  PieChart,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  section: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", section: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/#quotes", section: "quotes", label: "시세", icon: Activity },
  { href: "/#market-map", section: "market-map", label: "시장 지도", icon: LayoutGrid },
  { href: "/#portfolio", section: "portfolio", label: "포트폴리오", icon: PieChart },
  { href: "/#trades", section: "trades", label: "거래내역", icon: ListOrdered },
  { href: "/#analytics", section: "analytics", label: "분석", icon: LineChart },
  { href: "/#journal", section: "journal", label: "매매일지", icon: BookOpen },
];

export function labelForSection(section: string): string {
  return NAV_ITEMS.find((n) => n.section === section)?.label ?? "Folio";
}
