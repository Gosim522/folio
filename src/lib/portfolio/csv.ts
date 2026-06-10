import type { EnrichedTrade } from "./types";

/*
  거래내역을 표준 CSV 로 변환·다운로드. 엑셀이 UTF-8 한글을 깨먹지 않도록 BOM 으로
  시작한다 (Excel 이 BOM 을 보면 UTF-8 으로 인식, 없으면 시스템 인코딩 가정).
*/

const HEADERS = [
  "일시",
  "종목코드",
  "종목명",
  "시장",
  "구분",
  "수량",
  "단가",
  "통화",
  "환율",
  "거래금액(KRW)",
  "수수료",
  "세금",
  "실현손익(KRW)",
  "계좌",
  "메모",
];

function escapeField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // 필드에 쉼표·따옴표·개행이 있으면 따옴표로 감싸고 내부 따옴표를 두 번으로 이스케이프.
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function tradesToCsv(trades: EnrichedTrade[]): string {
  const rows: string[] = [HEADERS.join(",")];
  // 가장 오래된 거래부터 — 시간순으로 정렬해야 회계 흐름이 자연스러움.
  const sorted = [...trades].sort((a, b) =>
    a.tradedAt < b.tradedAt ? -1 : 1,
  );
  for (const t of sorted) {
    const grossKrw = Math.round(t.price * t.quantity * t.exchangeRate);
    const realized =
      t.side === "SELL" && typeof t.realizedPnlKrw === "number"
        ? Math.round(t.realizedPnlKrw)
        : "";
    rows.push(
      [
        t.tradedAt,
        t.symbol,
        t.name,
        t.market,
        t.side === "BUY" ? "매수" : "매도",
        t.quantity,
        t.price,
        t.market === "KR" ? "KRW" : "USD",
        t.exchangeRate,
        grossKrw,
        t.fee ?? 0,
        t.tax ?? 0,
        realized,
        t.account ?? "",
        t.note ?? "",
      ]
        .map(escapeField)
        .join(","),
    );
  }
  return rows.join("\r\n");
}

/** Browser-side download of the given CSV content as a file. */
export function downloadTradesCsv(
  trades: EnrichedTrade[],
  filename?: string,
): void {
  if (typeof window === "undefined") return;
  const csv = "﻿" + tradesToCsv(trades); // BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = filename ?? `folio-trades-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the click handler finishes.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
