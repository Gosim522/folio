export type WidgetId =
  | "market-strip"
  | "asset-summary"
  | "equity-chart"
  | "holdings-preview"
  | "top-movers"
  | "quote-list"
  | "market-clock"
  | "economic-calendar"
  | "market-heatmap"
  | "sector-performance"
  | "portfolio-kpi"
  | "allocation-panel"
  | "holdings-table"
  | "fx-gain"
  | "trade-list"
  | "trade-calendar"
  | "buy-sell-ratio"
  | "paper-trading"
  | "monthly-pnl"
  | "monthly-summary"
  | "trade-stats"
  | "portfolio-health"
  | "activity-chart"
  | "market-breakdown"
  | "tax-card"
  | "journal"
  | "journal-prompts";

export type WidgetDef = {
  id: WidgetId;
  label: string;
  defaultGroup: string;
  /** One-to-two sentence summary shown in the widget preview dialog. */
  description: string;
};

export type GroupDef = {
  id: string;
  label: string;
  widgets: WidgetId[];
  builtin?: boolean;
};
