import { WidgetHost } from "@/components/widgets/widget-host";
import { buildWidgetNodes } from "@/components/widgets/widget-nodes";
import type { BrokerId } from "@/lib/brokers";
import { loadPortfolio } from "@/lib/portfolio/server";
import { readKisCreds } from "@/lib/quotes/broker-creds";
import { fetchHeatmap } from "@/lib/quotes/heatmap";
import { fetchMarketStrip } from "@/lib/quotes/indices";
import { fetchQuotes } from "@/lib/quotes/provider";
import { fetchSectorPerformance } from "@/lib/quotes/sectors";
import { DEFAULT_WATCHLIST } from "@/lib/quotes/symbols";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ account?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  // ?account=toss|kis filters the portfolio to one broker account; absent = 전체.
  const { account: accountParam } = await searchParams;
  const account: BrokerId | undefined =
    accountParam === "toss" || accountParam === "kis"
      ? accountParam
      : undefined;

  // KIS keys (if the user entered them) — KR quotes then come from 한국투자증권.
  const kisCreds = await readKisCreds();

  const [portfolio, strip, heatmap, watchlistQuotes, sectors] = await Promise.all([
    loadPortfolio(account, kisCreds),
    fetchMarketStrip(),
    fetchHeatmap(),
    fetchQuotes(DEFAULT_WATCHLIST, kisCreds),
    fetchSectorPerformance(),
  ]);
  // Server Component — renders once per request; Date.now() captures fetch time.
  // eslint-disable-next-line react-hooks/purity
  const fetchedAt = Date.now();

  const nodes = buildWidgetNodes({
    portfolio,
    strip,
    quotes: watchlistQuotes,
    fetchedAt,
    heatmap,
    sectors,
  });

  return <WidgetHost nodes={nodes} />;
}
