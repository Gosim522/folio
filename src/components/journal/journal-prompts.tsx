"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

const ALL_PROMPTS: string[] = [
  "오늘 가장 잘한 매매 결정은? 이유는 무엇이었나요?",
  "오늘 가장 아쉬운 매매는? 다시 한다면 어떻게 할까요?",
  "보유 중인 종목 중 매도를 고민 중인 게 있나요? 기준은?",
  "이번 주에 새로 분석하고 싶은 종목은?",
  "최근 거래 빈도가 평소보다 잦았다면 그 원인은 무엇인가요?",
  "현재 포트폴리오에서 가장 큰 위험 요인 한 가지를 꼽는다면?",
  "한 달 전의 나에게 지금 시점에 해주고 싶은 조언은?",
  "오늘 시장 뉴스 중 가장 인상 깊었던 것과 그 영향은?",
  "지금 환율 / 금리 / 매크로 변화가 포트폴리오에 어떻게 작용 중인가요?",
  "최근 평균 보유 기간이 짧아지고 있나요? 의도된 변화인가요?",
  "감정적으로 결정한 매매가 있었다면 어떤 신호가 있었나요?",
  "한 종목에 비중이 너무 쏠려 있진 않은가요? 적정 비중은?",
];

const SHOWN_COUNT = 3;

function pickIndexes(seed: number, count: number, total: number): number[] {
  // Tiny deterministic shuffle: seeded LCG, then take first `count` distinct.
  let s = seed | 0 || 1;
  const pool = Array.from({ length: total }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function JournalPrompts() {
  // Seed defaults to the day-of-year so each day shows a stable set; user can
  // click 새 질문 to reshuffle.
  const defaultSeed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 1000 + Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
  }, []);
  const [seed, setSeed] = useState(defaultSeed);

  const prompts = pickIndexes(seed, SHOWN_COUNT, ALL_PROMPTS.length).map(
    (i) => ALL_PROMPTS[i],
  );

  return (
    <div className="space-y-3">
      <ol className="space-y-2.5">
        {prompts.map((p, i) => (
          <li
            key={`${seed}-${i}`}
            className="flex gap-3 rounded-xl border border-border bg-card/40 p-3"
          >
            <span className="tabular text-xs font-semibold text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm leading-relaxed text-foreground">{p}</span>
          </li>
        ))}
      </ol>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className="size-3" strokeWidth={2} />
          새 질문
        </button>
      </div>
    </div>
  );
}
