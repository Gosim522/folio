const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const intFormatter = new Intl.NumberFormat("ko-KR");
const decFormatter = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatKrw(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return krwFormatter.format(Math.round(value));
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return usdFormatter.format(value);
}

export function formatNumber(value: number, opts?: { decimals?: boolean }): string {
  if (!Number.isFinite(value)) return "—";
  return opts?.decimals ? decFormatter.format(value) : intFormatter.format(value);
}

export function formatPercent(value: number, opts?: { signed?: boolean; digits?: number }): string {
  if (!Number.isFinite(value)) return "—";
  const digits = opts?.digits ?? 2;
  const sign = opts?.signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatSignedKrw(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const abs = Math.abs(Math.round(value));
  return `${sign}${krwFormatter.format(abs)}`;
}

/** Returns "pos", "neg", or "" — used with tailwind text-pos / text-neg. */
export function pnlTone(value: number): "pos" | "neg" | "" {
  if (!Number.isFinite(value) || value === 0) return "";
  return value > 0 ? "pos" : "neg";
}
