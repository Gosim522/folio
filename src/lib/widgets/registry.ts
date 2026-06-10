import type { WidgetDef, WidgetId } from "./types";

export const WIDGETS: WidgetDef[] = [
  // 요약
  {
    id: "asset-summary",
    label: "자산 요약",
    defaultGroup: "overview",
    description:
      "총자산과 오늘 손익·평가손익·실현손익을 큰 숫자로 한눈에 요약해 주는 위젯이에요.",
  },
  {
    id: "portfolio-kpi",
    label: "포트폴리오 KPI",
    defaultGroup: "overview",
    description:
      "평가금액·평가손익·오늘 변동·실현손익을 카드 4개로 정리해서 보여줘요.",
  },
  {
    id: "equity-chart",
    label: "자산 변화 차트",
    defaultGroup: "overview",
    description:
      "기간을 골라 내 자산이 어떻게 변해왔는지 그래프로 확인할 수 있어요.",
  },
  {
    id: "top-movers",
    label: "오늘의 종목",
    defaultGroup: "overview",
    description:
      "오늘 가장 크게 움직인 보유 종목을 변동률이 큰 순서로 보여줘요.",
  },

  // 보유 종목
  {
    id: "holdings-preview",
    label: "내 종목",
    defaultGroup: "holdings",
    description:
      "보유 종목을 간단한 목록으로 추려서 평가금액과 손익만 빠르게 훑어볼 수 있어요.",
  },
  {
    id: "holdings-table",
    label: "보유 종목",
    defaultGroup: "holdings",
    description:
      "보유 종목 전체를 수량·평단가·현재가·평가손익·비중까지 표로 자세히 보여줘요.",
  },
  {
    id: "allocation-panel",
    label: "비중",
    defaultGroup: "holdings",
    description: "보유 종목별 자산 비중을 도넛 차트와 목록으로 보여줘요.",
  },

  // 손익 분석
  {
    id: "monthly-pnl",
    label: "월별 실현손익",
    defaultGroup: "pnl",
    description: "매도에서 발생한 실현손익을 월 단위로 합산해 막대그래프로 보여줘요.",
  },
  {
    id: "fx-gain",
    label: "달러 환차손익",
    defaultGroup: "pnl",
    description:
      "달러 보유분에서 주가가 아닌 환율 변동만 떼어낸 손익을 계산해 보여줘요.",
  },
  {
    id: "market-breakdown",
    label: "시장별 자산",
    defaultGroup: "pnl",
    description: "보유 자산을 국내·해외로 나눠 평가금액 비중을 보여줘요.",
  },
  {
    id: "monthly-summary",
    label: "이번 달 요약",
    defaultGroup: "pnl",
    description:
      "이번 달 실현손익·매매 건수·평균 거래액·예상 양도세를 한 카드에 보여줘요.",
  },
  {
    id: "trade-stats",
    label: "거래 통계",
    defaultGroup: "pnl",
    description:
      "Win Rate·평균 수익률·최고/최저 수익 종목·평균 보유 기간 — 청산된 매도 기반.",
  },
  {
    id: "portfolio-health",
    label: "포트폴리오 진단",
    defaultGroup: "overview",
    description:
      "집중도·손실 비중·종목 다변화·지역 분산 등 건강 신호를 종합 점수로 정리.",
  },
  {
    id: "tax-card",
    label: "세금 시뮬레이션",
    defaultGroup: "pnl",
    description:
      "실현된 양도손익을 기준으로 예상 세금을 계산해 봐요. 참고용 추정치예요.",
  },

  // 거래 기록
  {
    id: "trade-list",
    label: "거래 리스트",
    defaultGroup: "trades",
    description: "지금까지의 모든 매수·매도 거래 내역을 최신순으로 보여줘요.",
  },
  {
    id: "trade-calendar",
    label: "거래 캘린더",
    defaultGroup: "trades",
    description: "최근 1년간 거래가 있었던 날을 달력 형태로 한눈에 표시해요.",
  },
  {
    id: "buy-sell-ratio",
    label: "매수·매도 비율",
    defaultGroup: "trades",
    description: "거래 금액(원화)을 기준으로 매수와 매도의 비율을 보여줘요.",
  },
  {
    id: "activity-chart",
    label: "거래 활동",
    defaultGroup: "trades",
    description: "월별 매수·매도 횟수를 막대그래프로 보여줘요.",
  },

  // 모의 투자
  {
    id: "paper-trading",
    label: "모의 투자",
    defaultGroup: "paper",
    description:
      "가상으로 종목을 사고팔며 전략을 연습해요. 종목 검색, 매수가·매도가 직접 설정, 손실 큰 순 정렬을 지원해요.",
  },

  // 시세
  {
    id: "market-strip",
    label: "시장 지표 막대",
    defaultGroup: "quotes",
    description:
      "코스피·나스닥·S&P 500·환율 등 주요 지표를 스파크라인과 함께 한 줄로 보여줘요.",
  },
  {
    id: "quote-list",
    label: "시세 리스트",
    defaultGroup: "quotes",
    description:
      "관심 종목의 시세를 국내·해외로 나눠 보여주고 15초마다 자동으로 갱신해요.",
  },
  {
    id: "market-clock",
    label: "시장 시계",
    defaultGroup: "quotes",
    description: "한국·미국 장의 개장 상태와 다음 개장·마감 시각을 보여줘요.",
  },

  // 시장 동향
  {
    id: "market-heatmap",
    label: "시장 트리맵",
    defaultGroup: "market",
    description:
      "S&P 500을 섹터·종목 트리맵으로 — 칸 크기는 시가총액, 색은 당일 변동률이에요.",
  },
  {
    id: "sector-performance",
    label: "섹터별 변동률",
    defaultGroup: "market",
    description: "11개 미국 섹터 ETF의 기간별 수익률을 한눈에 비교해요.",
  },
  {
    id: "economic-calendar",
    label: "주요 일정",
    defaultGroup: "market",
    description:
      "FOMC·CPI·금통위·실적 등 주요 경제 일정을 중요도별로 보여줘요.",
  },

  // 매매일지
  {
    id: "journal",
    label: "매매일지",
    defaultGroup: "journal",
    description:
      "매매 결정과 회고를 남기는 일지 공간이에요. 디자인을 다듬는 중이에요.",
  },
  {
    id: "journal-prompts",
    label: "회고 질문",
    defaultGroup: "journal",
    description: "오늘의 매매를 돌아볼 회고 질문을 매일 새로 보여줘요.",
  },
];

export const WIDGET_IDS: WidgetId[] = WIDGETS.map((w) => w.id);

export const WIDGET_LABELS: Record<WidgetId, string> = Object.fromEntries(
  WIDGETS.map((w) => [w.id, w.label]),
) as Record<WidgetId, string>;

export const WIDGET_BY_ID: Record<WidgetId, WidgetDef> = Object.fromEntries(
  WIDGETS.map((w) => [w.id, w]),
) as Record<WidgetId, WidgetDef>;
