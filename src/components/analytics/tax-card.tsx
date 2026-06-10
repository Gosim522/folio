import type { TaxSimulation } from "@/lib/analytics/service";
import { formatKrw, formatSignedKrw } from "@/lib/format";
import { cn } from "@/lib/utils";

function pnlClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted-foreground";
}

export function TaxCard({ tax }: { tax: TaxSimulation }) {
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          국내 (소액주주 가정)
        </div>
        <Row label="실현손익" value={formatSignedKrw(tax.krRealizedKrw)} tone={pnlClass(tax.krRealizedKrw)} />
        <Row label="예상 세금" value={formatKrw(0)} sub="비과세 가정" />
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          해외 (양도소득세 시뮬레이션)
        </div>
        <Row label="실현손익" value={formatSignedKrw(tax.usRealizedKrw)} tone={pnlClass(tax.usRealizedKrw)} />
        <Row label="기본공제" value={`− ${formatKrw(tax.usDeductionKrw)}`} sub="연 250만원" />
        <Row label="과세표준" value={formatKrw(tax.usTaxableKrw)} />
        <Row
          label="예상 세금 (22%)"
          value={formatKrw(tax.usEstimatedTaxKrw)}
          tone={tax.usEstimatedTaxKrw > 0 ? "text-neg" : undefined}
          emphasize
        />
      </section>

      <p className="rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
        시뮬레이션 전용. 실제 세금 신고와는 다를 수 있으며, 회사 합산·이월공제·환율 적용 시점 등 변수를 반영하지 않습니다.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  tone,
  emphasize,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <div className="text-muted-foreground">
        {label}
        {sub ? <span className="ml-1 text-xs">· {sub}</span> : null}
      </div>
      <div
        className={cn(
          "tabular",
          emphasize ? "text-base font-semibold" : "font-medium",
          tone,
        )}
      >
        {value}
      </div>
    </div>
  );
}
