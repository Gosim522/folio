import { JournalPanel } from "@/components/journal/journal-panel";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "./section";

export function JournalSection() {
  return (
    <Section id="journal">
      <div className="space-y-6">
        <PageHeader
          title="매매일지"
          description="거래 결정과 회고를 자유롭게 남기는 공간 — 로컬에만 저장됩니다."
        />
        <JournalPanel />
      </div>
    </Section>
  );
}
