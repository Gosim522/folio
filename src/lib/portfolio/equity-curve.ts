export type EquityPoint = {
  date: string; // YYYY-MM-DD
  value: number;
};

/** Mulberry32 — small PRNG with deterministic seeding. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a synthetic equity curve that ends at `endValue` today.
 * Random walk is seeded so the shape stays stable across reloads;
 * the curve only stretches vertically as `endValue` changes.
 */
export function generateEquityCurve(
  endValue: number,
  days: number = 90,
  seed: number = 42,
): EquityPoint[] {
  const rand = mulberry32(seed);
  const factors: number[] = new Array(days);
  factors[days - 1] = 1;

  for (let i = days - 2; i >= 0; i--) {
    const noise = (rand() - 0.5) * 0.022; // ±1.1% daily noise
    const drift = 0.0007; // ~~20% annual drift
    const denom = 1 + drift + noise;
    factors[i] = factors[i + 1] / (denom > 0.5 ? denom : 0.5);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return factors.map((f, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - idx));
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.round(f * endValue),
    };
  });
}
