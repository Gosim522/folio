# Changelog

모든 의미있는 변경 사항을 버전별로 기록합니다. 위로 갈수록 최신.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 기반, 버전은 [SemVer](https://semver.org/lang/ko/).

## [0.21.0] — 2026-05-24

### ⚠️ 방향 전환: 정보 제공 전용 (BREAKING)

**Folio 는 보조 모니터에 띄워두는 정보 대시보드** — 거래를 위한 프로그램이 아닙니다.
사용자의 명시적 결정으로, 매수/매도 행위에 관여할 수 있는 모든 기능을 제거했습니다.
보안 면에서도 더 견고해지고, 향후 토스/KIS API 의 자동 거래 동기화가 들어올 때까지 데이터는
SAMPLE_TRADES 와 시세에만 의존합니다.

### 🗑️ 제거됨
- **거래 직접 추가 다이얼로그** (`AddTradeDialog`, `TradeFormDialog`) — v0.10/v0.13 추가됐던 것
- **+1주 빠른 매수 버튼** (홀딩 테이블·HoldingsPreview·평단 낮추기 코치) — v0.14/v0.15
- **CSV 가져오기** (`ImportTradesButton`, `parseTradesCsv`, `dedupTrades`) — v0.12/v0.14
- **사용자 거래 패널** (`UserTradesPanel`) — v0.10
- **PortfolioRoot 클라이언트 합산** — v0.11 (page → loadPortfolio → WidgetHost 직선 흐름으로 환원)
- **평단 낮추기 코치 위젯** (`AverageDownCoach`, `lib/portfolio/avg-down.ts`) — v0.18
- **평단 시뮬레이션** (TradeFormDialog 내) — v0.16
- **매매일지 ↔ 거래 연결** (드롭다운·라벨 칩) — v0.13
- **`n` 단축키** (새 거래 추가) — v0.17. `/` (검색 포커스) 는 유지
- **종목 선택 시 현재가 자동 prefill** — TradeFormDialog 의존이라 함께 제거
- **`folio:open-add-trade` / `folio:quick-add-trade` 이벤트**, `QuickAddHandler`
- **`pref:user.trades` localStorage 키** (기존 데이터는 무시됨, 백업/복원에서도 빠짐)

### ✅ 유지
- **모의 투자 (PaperTrading)** — 명시적으로 유지. 거래 시뮬레이션이지 실거래 아님.
- **거래 내역 표시** (SAMPLE_TRADES · TradeList · 검색·필터·정렬·CSV 내보내기) — read-only.
- **종목 매매 히스토리 모달** — read-only.
- **매매일지** (자유 메모 CRUD + 검색). 거래 연결만 제거.
- **가격 알림** — 정보 알림이지 거래 X.
- **모든 분석 위젯** — TradeStats · MonthlySummary · PortfolioHealth · MonthlyPnl · BuySellRatio
  · TaxCard · MarketBreakdown · FxGain · AllocationPanel · TradeCalendar 등.
- **모든 시세·시장 위젯** — MarketStrip · MarketHeatmap · QuoteList · MarketClock · SectorPerformance
  · EconomicCalendar.

### 🧪 테스트
- 제거된 코드의 테스트 (avg-down 9개, csv-import 14개) 함께 정리.
- **총 92 → 68** (남은 건 모두 read-only 분석 로직).

### 📝 기타
- 위젯 schema version 6 → 7 (`average-down-coach` 위젯이 사용자 레이아웃에서 자동 제거되도록).
- 기존 사용자의 localStorage 에 남아있는 `pref:user.trades`, 일지의 `tradeLabel` 필드는
  무시됨 — 자동 마이그레이션은 안 하지만 동작에 영향 없음.

---

## [0.20.0] — 2026-05-23

### ✨ 신기능
- **포트폴리오 진단 위젯** — 집중도(top3 weight), 손실 비중, 종목 다변화, 지역 분산(KR/US) 을
  각각 good/warning/danger 로 평가하고, 종합 건강 점수(0-100) 산출. 요약 그룹 위젯.
  계산은 `lib/analytics/portfolio-health.ts` 분리.

### 📝 문서
- **README 종합 갱신** — v0.20 시점 모든 기능을 카테고리별 (포트폴리오/거래·일지/분석/시세/알림/
  설정) 정리. install·dev·release 명령 + 보안·기술 스택까지.

### 🧪 테스트
- **`diagnosePortfolio` 회귀 6개** — 빈 입력/분산/집중/지역/다변화/손실.
- **총 86 → 92 개**.

### 📝 기타
- 위젯 schema version 5 → 6.

---

## [0.19.0] — 2026-05-23

### ✨ 신기능
- **거래 통계 위젯** — 매도(SELL) 거래 기반 분석. Win Rate, 평균 수익률, 최고/최저 수익 종목
  (누적 실현손익), 평균 보유 일수, 청산/전체 비율. 손익 분석 그룹.

### 🧹 리팩토링
- 평단 낮추기 계산식을 `lib/portfolio/avg-down.ts` 로 추출 (`qtyToReachTargetAvg`,
  `qtyToReachTargetLoss`, `newAvgAfterBuy`). AverageDownCoach 컴포넌트는 이제 lib 함수만 호출.
  → 회귀 테스트 가능해짐.

### 🧪 테스트
- **`avg-down` 회귀 9개** — 정상/올림/정의역 벗어남/이미 목표 달성 케이스.
- **`computeTradeStats` 회귀 6개** — 빈 입력/매수만/Win Rate/평균 수익률/종목별 누적/평균 보유 일수.
- **총 70 → 86 개**.

### 📝 기타
- 위젯 schema version 4 → 5.

---

## [0.18.0] — 2026-05-23

### ✨ 신기능
- **평단 낮추기 코치 위젯** — 사용자의 핵심 트레이딩 전략(1주씩 사며 평단 낮추기) 을 직접
  지원하는 신규 위젯. 손실 5% 이상 보유종목을 손실 큰 순서로 정렬해, **"평단을 −5% 손실까지
  낮추려면 현재가에 N주를 더 매수해야 함"** 을 종목마다 계산 표시. 각 행에 `+1주` 빠른 매수
  버튼. (보유 종목 그룹, widget id `average-down-coach`)
- **거래내역 정렬 옵션** — 검색·필터와 함께 정렬 토글 추가: 시간(기본) / 거래금액 / 실현손익.

### 📝 기타
- 위젯 schema version 3 → 4 (새 "평단 낮추기 코치" 위젯 기본 레이아웃 포함).

---

## [0.17.0] — 2026-05-23

### ✨ 신기능
- **종목 선택 시 현재가 자동 prefill** — TradeFormDialog 에서 종목을 picked 하면 즉시 `/api/quotes`
  를 한 번 호출해 시장 단가를 입력란에 채움. 사용자가 미리 수동 입력한 가격은 덮어쓰지 않음.
  거래 입력 단계가 한 번 줄어듦.
- **전역 단축키 `n` · `/`** —
  - `n` : 어디서든 새 거래 추가 다이얼로그 열기 (`folio:open-add-trade` 이벤트로 디커플)
  - `/` : 거래 내역 검색 입력 포커스 + 거래 위젯으로 스크롤
  - 단축키 도움말 (`?`) 에도 새 카테고리 "거래·검색" 추가.

---

## [0.16.0] — 2026-05-23

### ✨ 신기능
- **종목별 매매 히스토리 모달** — HoldingsTable 의 종목명 클릭 시 모달 — 그 종목의 모든 매매 +
  평단 변화(이전 → 이후) + 누적 수량 + 누적 실현손익을 시간순으로 한 표에 정리. 평단이 어떻게
  형성됐는지 즉시 감사할 수 있음.
- **거래 입력 시 평단 시뮬레이션** — TradeFormDialog 의 BUY 모드에서 종목·수량·단가가 채워지면
  "현재 N주 @ X원 → 매수 후 M주 @ Y원" 미리보기 카드. 평단이 내려가면 초록색 — 사용자의
  "마이너스 큰 종목 평단 낮추기" 전략에 직접 의사결정 보조.

### 🧹 코드 위생
- ESLint `argsIgnorePattern: "^_"` 적용 — 의도된 unused 표기 (`_heatmap` 등 revert path)
  가 더 이상 경고 안 띄움.
- `dist-electron/**` globalIgnores 추가 — 빌드 산출물이 린트 대상에서 빠짐.
- **결과: lint 0 errors, 0 warnings**.

---

## [0.15.0] — 2026-05-23

### ✨ 신기능
- **거래내역 검색·필터** — TradeList 상단에 종목/메모 검색바 + 매수·매도 토글 + 국내·해외 토글.
  거래가 누적되면 필수적. 클라이언트 사이드 즉시 필터링.
- **HoldingsPreview 에도 +1주 빠른 매수** — 대시보드의 보유종목 미리보기 각 행에도 `+1주` 칩.
  메인 화면에서 바로 사용자 매수 전략 실행.
- **이번 달 요약 카드 (신규 위젯)** — 손익 분석 그룹에 "이번 달 요약" 위젯 추가. 이달 실현손익
  (큰 글자) + 매수/매도 건수 + 평균 거래액 + 예상 양도세(US 슬라이스). 매월 1일에 자동 리셋.

### 📝 기타
- 위젯 schema version 2 → 3 (새 "이번 달 요약" 을 기본 레이아웃에 포함하기 위한 마이그레이션).

---

## [0.14.0] — 2026-05-23

### ✨ 신기능
- **보유종목 +1주 빠른 매수** — 사용자의 트레이딩 전략(1주씩 사며 평단 낮추기) 에 맞춰 홀딩
  테이블 각 종목 옆에 `+ 1주` 칩. 클릭하면 종목·현재가·환율이 prefill 된 TradeFormDialog 가
  떠서 단가/메모 확인 후 저장 한 번이면 됨. (`QuickBuyButton` → `folio:quick-add-trade` 이벤트
  → `QuickAddHandler` 가 받아 다이얼로그 오픈)
- **매매일지 검색** — JournalPanel 상단 검색바. 제목·내용·연결된 거래 라벨 전부 즉시 필터링.
- **CSV import 중복 검사** — `tradeHash` 로 종목·시각(분 단위)·구분·수량·단가가 같으면 중복.
  기존 user.trades 와 비교 + import 묶음 내부 중복까지 제거. 미리보기에 "가져올 N · 중복 M ·
  오류 K" 셋으로 명확히 분리 표시.

### 🧪 테스트
- **`tradeHash` + `dedupTrades` 회귀 4개**.
- **총 66 → 70 개**.

---

## [0.13.0] — 2026-05-23

### ✨ 신기능
- **거래 편집** — UserTradesPanel 의 각 거래에 편집 버튼 (✏️). 모든 필드 (단가/수량/일시/계좌/
  수수료/세금/메모/매수·매도) 를 수정해 같은 id 로 저장. `TradeFormDialog` 를 controlled 컴포넌트로
  리팩토링하고 `AddTradeDialog` / `UserTradesPanel` 가 트리거를 각자 제공.
- **매매일지 ↔ 거래 연결** — 일지 작성·편집 시 사용자 거래를 드롭다운에서 선택해 연결. 일지에
  연결된 거래는 작은 칩으로 표시 (`삼성전자 · 매수 5주`). 거래가 나중에 삭제돼도 연결 시점의
  라벨이 보존돼 컨텍스트 유지.

### 🧪 테스트
- **`parseTradesCsv` 회귀 10개** — BOM/escape/필수 컬럼 누락/시장 자동 보완/잘못된 줄 건너뛰기/
  US 환율 폴백/LF-only CSV/계좌 한글 표기 등.
- **`alertHits` + `newAlertId` 회귀 6개** — above/below 경계, 발동된 알림 비활성, 비정상 가격,
  id 고유성.
- **총 50 → 66 개**.

---

## [0.12.0] — 2026-05-23

### ✨ 신기능
- **CSV 가져오기** — `tradesToCsv` 의 역. 거래내역 카드의 "CSV 가져오기" 버튼 → 파일 선택 →
  파싱·검증 → 가져올 건수와 오류 미리보기 → 확인 시 user.trades 에 추가. RFC 4180 호환
  파서 (따옴표·이스케이프·BOM·줄 안 개행 처리). 한글/영문 컬럼명 둘 다 인식.
- **가격 알림** — 설정 Sheet 의 "가격 알림" 섹션에서 종목별 상회/하회 목표가 설정. 30 초마다
  현재가 폴링 → 조건 충족 시 (1) 데스크톱 알림 (권한 받으면), (2) 우상단 인앱 토스트.
  한 번 발동된 알림은 자동 비활성 → "재설정" 으로 다시 활성화 가능.
  - `lib/alerts/types.ts` (PriceAlert 타입 + 조건 체크), `price-alert-watcher.tsx` (워처),
    `alert-toast.tsx` (토스트), `settings/price-alerts-panel.tsx` (관리 UI).

---

## [0.11.0] — 2026-05-23

### ✨ 통합 (큰 변화)
- **사용자 추가 거래가 portfolio 전체에 합산** — v0.10.0 에서 추가한 거래가 별도 패널에만
  보이던 한계를 해소. 새 `PortfolioRoot` 클라이언트 컴포넌트가 SAMPLE_TRADES + user.trades 를
  병합해 `buildPortfolio` 를 다시 실행 → 자산 요약·홀딩 테이블·월별 손익·세금 시뮬·시장별 분석까지
  모든 위젯에 사용자 거래가 반영됨. 계좌별 필터(?account=) 도 user.trades 에 일관 적용.

### 🧪 테스트
- **`tradesToCsv` 회귀 9개** — 빈/한건/한글 헤더/매수·매도 변환/CSV 이스케이프(쉼표·따옴표·개행)/
  시간순/USD 환율/SELL realizedPnl/BUY 빈 값/수수료·세금 컬럼.
- **총 41 → 50 개**.

---

## [0.10.0] — 2026-05-23

### ✨ 신기능
- **거래 직접 추가 UI** — 거래 내역 카드의 "거래 추가" 버튼으로 모달 열기. 종목 검색
  (한글/영문/티커/별칭), 매수·매도 토글, 수량·단가·환율·일시·계좌·수수료·세금·메모 입력.
  US 종목은 라이브 USD/KRW 가 환율 기본값. localStorage 의 `user.trades` 에 저장됨.
  ("내가 추가한 거래" 패널에 표시 + 삭제 가능. **v0.11.0 에서 dashboard·analytics 도 합산 반영
  예정.**)
- **설정 → 도움말 → 키보드 단축키 보기** — 단축키 오버레이 발견성 향상. 설정 Sheet 안 링크로도
  열 수 있음 (커스텀 이벤트 `folio:open-shortcuts` 디스패치).

### 🧪 테스트
- **`searchSymbols` / `findSymbol` 회귀 13개** — 한글/영문/티커/대소문자/공백/limit/없는 단어 등.
- **총 28 → 41 개**.

---

## [0.9.0] — 2026-05-23

### ✨ 신기능
- **매매일지 실작성·저장** — 기존 stub 위젯/섹션을 실제 CRUD 일지로 구현. 새 글 작성·편집·삭제,
  제목/내용 자유 입력, 작성·수정 시각 자동 기록. localStorage 에 보관 — 외부 동기화 없음.
- **거래내역 CSV 내보내기** — TradesSection·trade-list 위젯 우상단에 "CSV 내보내기" 버튼.
  UTF-8 BOM 포함이라 엑셀에서 한글 깨짐 없음. 헤더 + 수수료/세금/실현손익까지 모든 컬럼 포함.

### 📦 번들 사이즈
- **인스톨러 ~60MB 절감** — Pretendard 를 npm 패키지(99MB 전체 번들) 대신 단일 Variable Font
  파일(2MB) 만 `public/fonts/` 에 self-host. 풀 dynamic-subset 의 수십 개 woff2 청크가 불필요하게
  포함되던 문제 해소.

### 🧪 테스트
- **analytics 회귀 테스트 10개** — `monthlyRealizedPnl`, `monthlyActivity`, `marketBreakdown`,
  `taxSimulation` (KR 비과세, US 공제, US 양도세 22%, US 손실 케이스).
- **`generateEquityCurve` 회귀 테스트 7개** — 결정론·시드별 다양성·날짜 형식·짧은 range 가 긴 range
  의 tail 과 일치 (시각 연속성 보장) 등.
- **총 테스트 11 → 28 개**.

---

## [0.8.0] — 2026-05-23

### 🐛 버그 수정
- **화면 확대·축소 시 사이드바 깨짐** — CSS `zoom` 을 `<html>` 에 적용해 sticky/flex 레이아웃이
  망가지던 회귀(v0.4.0 도입). Electron 의 `webFrame.setZoomFactor()` 로 전환 — Chromium 네이티브
  줌이라 레이아웃 무결성 유지. 웹(브라우저)에서는 `<main>` 만 CSS zoom 으로 폴백.

### ✨ 신기능
- **줌 인디케이터** — 줌 변경 시 우상단에 "125%" 같은 배율 칩이 1.1초 잠깐 표시.
- **키보드 단축키 도움말 오버레이** — `?` 키로 토글. 줌·섹션 이동·데스크톱 단축키 한 곳 정리.

### ♻️ 리팩토링
- `usePreference` 를 `useSyncExternalStore` 로 — 캐스케이드 렌더 위험 + tearing 위험 제거. 안정 참조
  캐시로 무한 재렌더 방지.
- `useChartTokens` 를 모듈 공유 MutationObserver + `useSyncExternalStore` 로 — 컴포넌트마다 옵저버
  생성하던 낭비 제거.
- `useActiveSection` 을 모듈 공유 스크롤 리스너 + `useSyncExternalStore` 로 — 마찬가지로 단일 인스턴스.
- 모든 `react-hooks/set-state-in-effect` 린트 위반 (5건) 해소.

### 📝 인프라
- **CHANGELOG.md 도입** — 이 파일. 버전별로 추가/수정/제거를 기록.
- **GitHub Actions CI** — push/PR 마다 `tsc + lint + test` 자동 실행 (`.github/workflows/ci.yml`).

---

## [0.7.0] — 2026-05-23

### ✨ 신기능
- **Vitest 단위 테스트 환경** — `npm test` / `npm run test:watch`. 순수 함수 회귀 안전망.
- `buildPortfolio` 회귀 테스트 11개 — 매수/매도/수수료·세금/이동평균/라이브 FX/오늘 변화 등 핵심
  케이스. CI 와 함께 가면 미래 변경에 대한 안전망.

---

## [0.6.0] — 2026-05-23

### 🔒 보안
- **Pretendard CDN 의존성 제거** — `globals.css` 가 외부 CDN `@import` 하던 것을 `npm i pretendard`
  로 자립. CDN 침해·다운 위험 제거.
- **KIS API 키 쿠키를 `HttpOnly` 로** — 이전엔 `document.cookie` 로 직접 쓰던 것을 `POST /api/broker/keys`
  서버 라우트가 `Set-Cookie: HttpOnly; SameSite=Strict` 로 굽도록 변경. **페이지의 어떤 JS 도 키를
  읽지 못한다** (XSS·CDN 침해 시에도 안전).

---

## [0.5.0] — 2026-05-23

### 🐛 버그 수정
- **평가금액이 평균 매수 환율로 계산되던 문제** — USD/KRW 가 변해도 KRW 환산이 안 따라가던 것을
  `lib/quotes/fx.ts#fetchUsdKrw()` 라이브 환율로 교체. 환차익이 미실현손익에 정확히 반영.
- **`activeBroker` 우선순위 불일치** — 토스가 우선순위 1이지만 미구현(`implemented:false`)이라
  인디케이터/실제 데이터 소스가 어긋나던 것을 `implemented:true` 만 우선순위 적용으로 수정.
- **최대화 상태에서 종료 후 재시작 시 일반 창으로 복원되던 문제** — `window-state.json` 에
  `isMaximized` 도 저장하고 복원 시 `mainWindow.maximize()` 호출.

---

## [0.4.0] — 2026-05-23

### ✨ 신기능
- **상단 바에 현재 버전 표시** — `package.json` 의 버전을 읽어 Topbar 의 "Folio" 옆에 작은 칩으로.
- **Ctrl+휠 / Ctrl+`+`/`-` / Ctrl+`0` 으로 화면 확대·축소** — 브라우저 스타일 줌. localStorage 에 저장돼
  다음 실행 복원. (v0.8.0 에서 Electron 네이티브 줌으로 교체됨.)

### 🐛 버그 수정
- **PnL 계산이 수수료·세금을 무시하던 문제** — `buildPortfolio` 가 매수 시 cost basis 에 `fee+tax`
  포함, 매도 시 realized PnL 에서 `fee+tax` 차감. 평단/실현손익/세금 시뮬레이션 정확도 향상.
- **`release.ps1` 콘솔 출력 한글이 캡처 로그에서 깨지던 문제** — UTF-8 OutputEncoding 적용.

### ♻️ 정리
- 죽은 코드 `migrateWidgetPrefsOnce` 제거.
- 미사용 `next-themes` 의존성 제거.

---

## [0.3.0] — 2026-05-23

### ✨ 신기능
- **한국투자증권(KIS) API 실연동** — `lib/quotes/kis.ts` 가 KIS OpenAPI 로 KR 종목 시세 조회.
  토큰 24h 캐시 + 1/min 발행 제한 준수. 마이페이지에서 키 입력 시 KR 시세가 KIS 에서 옴
  (US 는 Yahoo). `lib/quotes/provider.ts` 오케스트레이터 + `broker-creds.ts` 서버 쿠키 리더 +
  `BrokerKeySync` 클라이언트 쿠키 미러.
- **인앱 업데이트 알림 배너** — `electron-updater` 의 `update-downloaded` IPC 를 받아 "지금 재시작"
  배너를 띄움. `quitAndInstall()` 로 재시작·업데이트.
- **데스크톱 앱 아이콘** — `scripts/make-icons.mjs` 가 SVG → `electron/icon.ico` (7 사이즈) 생성.

### 🐛 버그 수정
- `next-themes` 의 `<script>` React 19 dev 경고 — 커스텀 `ThemeProvider` 가 `useServerInsertedHTML`
  로 FOUC 스크립트 주입하도록 교체.
- `backup`/`release` 스크립트가 dev 서버를 자동 종료 — 포트 3000 충돌 방지.
- 차트 컴포넌트들에 마운트 게이트 추가 — recharts SSR `width(-1)` 경고 제거.

### 📝 인프라
- `package.json` 에 `description`·`author`·`build.win.icon` 추가.
- `scripts/release.ps1` 이 backup 도 자동 호출 — 한 명령으로 백업·빌드·발행·버전증가.
- `.ps1` 파일들에 UTF-8 BOM 부착 — PS 5.1 이 한글 경로 정확히 인식.

---

## [0.2.0] 및 이전

초기 골격 — Next.js 16 + Electron 42 + Tailwind v4 + shadcn(base-nova) + Yahoo Finance 시세 +
샘플 거래 기반 포트폴리오 엔진 + 위젯 기반 단일 페이지 + localStorage 사용자 설정.
