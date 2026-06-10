"use client";

import { PillGroup } from "@/components/common/pill-group";
import { usePreference } from "@/hooks/use-preferences";
import type { Holding } from "@/lib/portfolio/types";
import { AllocationDonut, type Basis } from "./allocation-donut";
import { AllocationList } from "./allocation-list";

type View = "list" | "donut";

const VIEW_OPTIONS = [
  { value: "list" as const, label: "리스트" },
  { value: "donut" as const, label: "도넛" },
];

const BASIS_OPTIONS = [
  { value: "market" as const, label: "평가금액" },
  { value: "cost" as const, label: "투자원금" },
];

export function AllocationPanel({ holdings }: { holdings: Holding[] }) {
  const [view, setView] = usePreference<View>("portfolio.allocationView", "list");
  const [basis, setBasis] = usePreference<Basis>("portfolio.basis", "market");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <PillGroup
          ariaLabel="보기 방식"
          value={view}
          onChange={setView}
          options={VIEW_OPTIONS}
        />
        <PillGroup
          ariaLabel="비중 기준"
          value={basis}
          onChange={setBasis}
          options={BASIS_OPTIONS}
        />
      </div>

      {view === "donut" ? (
        <AllocationDonut holdings={holdings} basis={basis} />
      ) : (
        <AllocationList holdings={holdings} basis={basis} />
      )}
    </div>
  );
}
