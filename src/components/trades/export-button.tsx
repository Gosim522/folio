"use client";

import { Download } from "lucide-react";
import { downloadTradesCsv } from "@/lib/portfolio/csv";
import type { EnrichedTrade } from "@/lib/portfolio/types";

/** 거래내역을 CSV 로 내보내는 버튼. UTF-8 BOM 포함 — 엑셀에서 한글 깨짐 없음. */
export function ExportTradesButton({ trades }: { trades: EnrichedTrade[] }) {
  return (
    <button
      type="button"
      onClick={() => downloadTradesCsv(trades)}
      disabled={trades.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      title="거래내역을 CSV 로 저장 (엑셀 호환)"
    >
      <Download className="size-3.5" strokeWidth={2} />
      CSV 내보내기
    </button>
  );
}
