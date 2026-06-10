import { PageHeader } from "@/components/common/page-header";
// import { MarketHeatmap } from "@/components/dashboard/market-heatmap"; // 비활성 — 직접 구현 d3 트리맵 (revert path)
import { MarketHeatmapTradingView } from "@/components/dashboard/market-heatmap-tradingview";
import type { HeatmapSector } from "@/lib/quotes/heatmap";
import { Section } from "./section";

type Props = {
  /** Kept for revert path to the d3-hierarchy custom heatmap. */
  heatmap: HeatmapSector[];
};

export function MarketMapSection({ heatmap: _heatmap }: Props) {
  return (
    <Section id="market-map">
      <div className="space-y-6">
        <PageHeader
          title="시장 지도"
          description="S&P 500 섹터·종목 — TradingView 라이브 트리맵"
        />
        {/* 직접 구현한 d3-hierarchy 트리맵으로 되돌리려면 아래 한 줄을 사용:
            <MarketHeatmap sectors={_heatmap} /> */}
        <MarketHeatmapTradingView />
      </div>
    </Section>
  );
}
