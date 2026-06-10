"use client";

import {
  hierarchy,
  treemap,
  treemapSquarify,
  type HierarchyRectangularNode,
} from "d3-hierarchy";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  HeatmapSector,
  HeatmapStock as _HeatmapStock,
} from "@/lib/quotes/heatmap";

// Standard market convention — independent of user's PnL color direction.
const POS = [34, 197, 94];
const NEG = [239, 68, 68];
const NEUTRAL = [55, 65, 81];
const PANEL_BG = "rgb(15,15,15)";
const SECTOR_GAP = 2;
const STOCK_GAP = 1;
const SECTOR_HEADER_HEIGHT = 16;

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}
function cellColor(rate: number): string {
  const t = Math.min(1, Math.abs(rate) / 4);
  const target = rate >= 0 ? POS : NEG;
  return `rgb(${lerp(NEUTRAL[0], target[0], t)}, ${lerp(NEUTRAL[1], target[1], t)}, ${lerp(NEUTRAL[2], target[2], t)})`;
}

type TreeRoot = {
  name: string;
  children: Array<{
    name: string; // sector
    children: Array<{
      name: string; // ticker
      value: number;
      changeRate: number;
    }>;
  }>;
};

function buildTree(sectors: HeatmapSector[]): TreeRoot {
  return {
    name: "S&P 500",
    children: sectors.map((s) => ({
      name: s.sector,
      children: s.stocks.map((st) => ({
        name: st.symbol,
        value: st.marketCapB,
        changeRate: st.changeRate,
      })),
    })),
  };
}

type LeafDatum = { name: string; value: number; changeRate: number };
type BranchDatum = { name: string; children: unknown[] };

function isLeaf(d: unknown): d is LeafDatum {
  return typeof (d as LeafDatum).value === "number";
}

export function MarketHeatmap({ sectors }: { sectors: HeatmapSector[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(960);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.round(e.contentRect.width);
        if (w > 0) setWidth(w);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const height = Math.round(Math.max(420, Math.min(720, width * 0.5)));

  const layout = useMemo(() => {
    if (sectors.length === 0) return null;
    const tree = buildTree(sectors);
    const root = hierarchy<unknown>(tree, (d) => (d as BranchDatum).children)
      .sum((d) => (isLeaf(d) ? d.value : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    treemap<unknown>()
      .size([width, height])
      .paddingOuter(0)
      .paddingTop((node) => (node.depth === 0 ? SECTOR_GAP : SECTOR_HEADER_HEIGHT))
      .paddingInner(SECTOR_GAP)
      .paddingBottom(0)
      .paddingLeft(0)
      .paddingRight(0)
      .tile(treemapSquarify.ratio(1.4))(root as HierarchyRectangularNode<unknown>);

    return root as HierarchyRectangularNode<unknown>;
  }, [sectors, width, height]);

  if (sectors.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-muted/40 text-sm text-muted-foreground">
        시세 데이터를 불러오지 못했어요
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl"
      style={{ background: PANEL_BG }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background */}
        <rect width={width} height={height} fill={PANEL_BG} />

        {layout
          ? layout.descendants().map((node, i) => {
              if (node.depth === 0) return null;
              const w = node.x1 - node.x0 - (node.depth === 2 ? STOCK_GAP * 2 : 0);
              const h = node.y1 - node.y0 - (node.depth === 2 ? STOCK_GAP * 2 : 0);
              const x = node.x0 + (node.depth === 2 ? STOCK_GAP : 0);
              const y = node.y0 + (node.depth === 2 ? STOCK_GAP : 0);
              if (w <= 0 || h <= 0) return null;

              // Sector branch — render header label only (cells render on top via leaves)
              if (node.depth === 1) {
                const sectorName = (node.data as BranchDatum).name;
                const fullW = node.x1 - node.x0;
                const headerY = node.y0;
                return (
                  <g key={`sector-${i}`} style={{ pointerEvents: "none" }}>
                    {fullW > 60 ? (
                      <text
                        x={node.x0 + 5}
                        y={headerY + 11}
                        fontSize={10}
                        fontWeight={700}
                        fill="rgb(220,220,220)"
                        style={{ letterSpacing: "0.06em" }}
                      >
                        {sectorName.toUpperCase()}
                      </text>
                    ) : null}
                  </g>
                );
              }

              // Leaf — stock cell
              const data = node.data as LeafDatum;
              const rate = data.changeRate;
              const fontSize = Math.max(9, Math.min(20, Math.min(w, h) / 4.2));
              const fits = w > 32 && h > 22;
              return (
                <g key={`leaf-${i}-${data.name}`}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={cellColor(rate)}
                    stroke={PANEL_BG}
                    strokeWidth={0.5}
                  />
                  {fits ? (
                    <>
                      <text
                        x={x + w / 2}
                        y={y + h / 2 - 1}
                        fontSize={fontSize}
                        textAnchor="middle"
                        fill="white"
                        fontWeight={700}
                        style={{ pointerEvents: "none" }}
                      >
                        {data.name}
                      </text>
                      {h > 40 ? (
                        <text
                          x={x + w / 2}
                          y={y + h / 2 + fontSize - 1}
                          fontSize={Math.max(8, fontSize * 0.65)}
                          textAnchor="middle"
                          fill="white"
                          fillOpacity={0.9}
                          style={{ pointerEvents: "none" }}
                        >
                          {rate >= 0 ? "+" : ""}
                          {rate.toFixed(2)}%
                        </text>
                      ) : null}
                    </>
                  ) : null}
                </g>
              );
            })
          : null}
      </svg>
    </div>
  );
}
