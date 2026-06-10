import type { Holding } from "@/lib/portfolio/types";

/*
  포트폴리오 건강도 진단. 위젯에서 보여줄 indicator 들의 계산.

  설계 메모: 모든 임계값은 "전형적인 개인 투자 권장" 수준의 단순 휴리스틱.
  학술적 근거보다 "사용자가 한 눈에 위험 신호를 알아채는 데" 초점.
*/

export type HealthLevel = "good" | "warning" | "danger";

export type HealthIndicator = {
  key: string;
  label: string;
  level: HealthLevel;
  message: string;
};

const CONCENTRATION_TOP3_DANGER = 70; // top3 가 70% 이상이면 danger
const CONCENTRATION_TOP3_WARNING = 50;

const LOSS_RATIO_DANGER = 60; // 보유 중 60% 이상이 손실이면 danger
const LOSS_RATIO_WARNING = 40;

const DIVERSITY_MIN_HOLDINGS = 3;
const DIVERSITY_GOOD_HOLDINGS = 7;

export type PortfolioHealth = {
  indicators: HealthIndicator[];
  /** 종합 점수 0-100 (높을수록 건강). 정성적 — 참고용. */
  score: number;
};

export function diagnosePortfolio(holdings: Holding[]): PortfolioHealth {
  if (holdings.length === 0) {
    return {
      indicators: [
        {
          key: "empty",
          label: "보유 종목 없음",
          level: "warning",
          message: "포트폴리오가 비어 있어요.",
        },
      ],
      score: 0,
    };
  }

  const indicators: HealthIndicator[] = [];

  // 1. 집중도 — top 3 종목 비중
  const sorted = [...holdings].sort((a, b) => b.weight - a.weight);
  const top3Weight = sorted
    .slice(0, 3)
    .reduce((acc, h) => acc + h.weight, 0);
  if (top3Weight >= CONCENTRATION_TOP3_DANGER) {
    indicators.push({
      key: "concentration",
      label: "집중도",
      level: "danger",
      message: `상위 3종목이 전체의 ${top3Weight.toFixed(0)}% — 한 종목 큰 하락이 전체에 큰 충격.`,
    });
  } else if (top3Weight >= CONCENTRATION_TOP3_WARNING) {
    indicators.push({
      key: "concentration",
      label: "집중도",
      level: "warning",
      message: `상위 3종목이 전체의 ${top3Weight.toFixed(0)}% — 약간 집중된 편.`,
    });
  } else {
    indicators.push({
      key: "concentration",
      label: "집중도",
      level: "good",
      message: `상위 3종목 ${top3Weight.toFixed(0)}% — 적절히 분산.`,
    });
  }

  // 2. 손실 종목 비율
  const losersCount = holdings.filter((h) => h.unrealizedPnlKrw < 0).length;
  const lossRatio = (losersCount / holdings.length) * 100;
  if (lossRatio >= LOSS_RATIO_DANGER) {
    indicators.push({
      key: "losses",
      label: "손실 종목 비중",
      level: "danger",
      message: `보유 ${holdings.length}개 중 ${losersCount}개 마이너스 (${lossRatio.toFixed(0)}%).`,
    });
  } else if (lossRatio >= LOSS_RATIO_WARNING) {
    indicators.push({
      key: "losses",
      label: "손실 종목 비중",
      level: "warning",
      message: `${losersCount}/${holdings.length} 종목이 손실 중 (${lossRatio.toFixed(0)}%).`,
    });
  } else {
    indicators.push({
      key: "losses",
      label: "손실 종목 비중",
      level: "good",
      message: `${holdings.length}개 중 ${losersCount}개만 손실 — 양호.`,
    });
  }

  // 3. 다변화 — 종목 수
  if (holdings.length < DIVERSITY_MIN_HOLDINGS) {
    indicators.push({
      key: "diversity",
      label: "종목 다변화",
      level: "warning",
      message: `보유 종목 ${holdings.length}개 — 3개 이상 권장.`,
    });
  } else if (holdings.length < DIVERSITY_GOOD_HOLDINGS) {
    indicators.push({
      key: "diversity",
      label: "종목 다변화",
      level: "good",
      message: `${holdings.length}개 종목 보유 — 무리 없음.`,
    });
  } else {
    indicators.push({
      key: "diversity",
      label: "종목 다변화",
      level: "good",
      message: `${holdings.length}개 종목으로 잘 분산됨.`,
    });
  }

  // 4. 지역 다변화 (KR vs US)
  const krValue = holdings
    .filter((h) => h.market === "KR")
    .reduce((acc, h) => acc + h.marketValueKrw, 0);
  const usValue = holdings
    .filter((h) => h.market === "US")
    .reduce((acc, h) => acc + h.marketValueKrw, 0);
  const total = krValue + usValue;
  if (total > 0) {
    const krPct = (krValue / total) * 100;
    const krLabel = `국내 ${krPct.toFixed(0)}% / 해외 ${(100 - krPct).toFixed(0)}%`;
    if (krPct === 100 || krPct === 0) {
      indicators.push({
        key: "region",
        label: "지역 다변화",
        level: "warning",
        message: `${krPct === 100 ? "국내 전부" : "해외 전부"} — 통화/지역 다변화 고려.`,
      });
    } else {
      indicators.push({
        key: "region",
        label: "지역 다변화",
        level: "good",
        message: krLabel,
      });
    }
  }

  // 점수 — 단순한 가중 평균.
  const weights = { good: 100, warning: 60, danger: 20 } as const;
  const score = Math.round(
    indicators.reduce((acc, i) => acc + weights[i.level], 0) / indicators.length,
  );

  return { indicators, score };
}
