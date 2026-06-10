import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import {
  diagnosePortfolio,
  type HealthLevel,
} from "@/lib/analytics/portfolio-health";
import type { Holding } from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

function levelClass(level: HealthLevel): string {
  switch (level) {
    case "good":
      return "text-pos";
    case "warning":
      return "text-foreground/80";
    case "danger":
      return "text-neg";
  }
}

function levelIcon(level: HealthLevel): React.ReactNode {
  switch (level) {
    case "good":
      return <CheckCircle2 className="size-4 text-pos" strokeWidth={2} />;
    case "warning":
      return <Circle className="size-4 text-muted-foreground" strokeWidth={2} />;
    case "danger":
      return <AlertTriangle className="size-4 text-neg" strokeWidth={2} />;
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-pos";
  if (score >= 60) return "text-foreground";
  if (score >= 40) return "text-foreground/80";
  return "text-neg";
}

export function PortfolioHealthCard({ holdings }: { holdings: Holding[] }) {
  const { indicators, score } = diagnosePortfolio(holdings);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className={cn("tabular text-3xl font-semibold", scoreColor(score))}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100 — 건강 점수</span>
      </div>
      <ul className="space-y-2">
        {indicators.map((ind) => (
          <li
            key={ind.key}
            className="flex items-start gap-2.5 rounded-lg border border-border bg-card/40 p-2.5"
          >
            <div className="mt-0.5 shrink-0">{levelIcon(ind.level)}</div>
            <div className="min-w-0 flex-1">
              <div className={cn("text-xs font-semibold", levelClass(ind.level))}>
                {ind.label}
              </div>
              <p className="mt-0.5 text-xs text-foreground/85">{ind.message}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground">
        ※ 임계값은 일반적 권장 휴리스틱이에요. 종목 특성·투자 목표에 따라 다를 수 있어요.
      </p>
    </div>
  );
}
