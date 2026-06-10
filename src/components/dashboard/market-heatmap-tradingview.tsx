"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useRef, useState } from "react";

const HEIGHT_PX = 600;
/** Re-inject the widget if the tab was hidden longer than this. */
const STALE_AFTER_MS = 3 * 60_000;

/**
 * TradingView Stock Heatmap embed.
 * - Drops a <script> from s3.tradingview.com into the container; the script
 *   reads its own JSON innerText as config.
 * - Re-mounts when theme changes since the widget bakes colorTheme at load time.
 * - Re-mounts when returning to the tab after a long absence so a tab left open
 *   overnight doesn't keep showing yesterday's heatmap.
 */
export function MarketHeatmapTradingView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const colorTheme = resolvedTheme === "dark" ? "dark" : "light";
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let hiddenAt: number | null = null;
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else {
        if (hiddenAt !== null && Date.now() - hiddenAt > STALE_AFTER_MS) {
          setReloadKey((k) => k + 1);
        }
        hiddenAt = null;
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = `
      <div class="tradingview-widget-container__widget" style="height:100%;width:100%;"></div>
      <div class="tradingview-widget-copyright" style="text-align:right;padding:6px 8px;">
        <a href="https://www.tradingview.com/markets/world-stocks/worlds-largest-companies/" rel="noopener nofollow" target="_blank" style="font-size:11px;color:var(--muted-foreground);">
          TradingView 제공
        </a>
      </div>
    `;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "ko",
      symbolUrl: "",
      colorTheme,
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: HEIGHT_PX,
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [colorTheme, reloadKey]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container overflow-hidden rounded-2xl border border-border bg-card"
      style={{ height: HEIGHT_PX + 32 }}
    />
  );
}
