import { useEffect, useState } from "react";

/**
 * True only after the first client commit. Gate SSR-incompatible UI with it —
 * notably recharts' `ResponsiveContainer`, which can't measure during SSR and
 * logs `width(-1) height(-1)` warnings.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Intentional one-time post-hydration flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  return mounted;
}
