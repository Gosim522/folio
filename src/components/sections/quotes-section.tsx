import { PageHeader } from "@/components/common/page-header";
import { QuoteList } from "@/components/quotes/quote-list";
import type { Quote } from "@/lib/quotes/types";
import { Section } from "./section";

export function QuotesSection({
  initialQuotes,
  initialFetchedAt,
}: {
  initialQuotes: Quote[];
  initialFetchedAt: number;
}) {
  return (
    <Section id="quotes">
      <div className="space-y-6">
        <PageHeader
          title="시세"
          description="Yahoo Finance 공개 데이터 — 시세는 15분 정도 지연될 수 있습니다."
        />
        <QuoteList initialQuotes={initialQuotes} initialFetchedAt={initialFetchedAt} />
      </div>
    </Section>
  );
}
