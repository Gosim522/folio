# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 위치 (먼저 읽을 것)

**`C:\Users\user\Desktop\folio` 가 이 프로젝트의 정식 작업 폴더다.** 모든 개발·빌드·릴리스를 여기서 한다.

`C:\Users\user\Desktop\개인 프로젝트\개발 중_Folio` 는 사용자가 여는 것을 선호하는 옛 위치다.
경로에 한글이 있어 electron-builder 데스크톱 패키징이 실패하므로 거기서 작업하면 안 된다.
그 폴더에서 세션이 시작되면 `개발 중_Folio\CLAUDE.md` 상단 안내에 따라 모든 파일·명령 작업을
이곳(`C:\Users\user\Desktop\folio`)으로 옮긴다. 옛 폴더의 파일은 수정하지 않는다.

@AGENTS.md

## Commands

```powershell
npm run dev              # next dev --webpack — http://localhost:3000
npm run build            # next build --webpack (standalone 출력)
npm run lint             # eslint
npm test                 # vitest run (단위 테스트 — buildPortfolio 등 순수 함수)
npm run test:watch       # vitest 워치 모드 (개발 중 즉시 피드백)
                         # ↑ tsc + lint + test 는 .github/workflows/ci.yml 이 push/PR 마다 자동 실행
npm run electron         # 로컬에서 Electron 앱 실행 (먼저 npm run dev 가 떠 있어야 함)
npm run desktop:dir      # dist-electron/win-unpacked/ — 설치 파일 없이 폴더 형태 (테스트용)
npm run desktop:build    # dist-electron/Folio Setup x.x.x.exe — 배포용 설치 파일 (업로드 안 함)
npm run desktop:release  # 빌드 + GitHub Releases 업로드 (GH_TOKEN 환경변수 필요)
npm run backup           # scripts/backup-and-bake.ps1 — 버전 자동증가 백업 zip 생성 후 desktop:build
npm run release          # scripts/release.ps1 — desktop:release 발행 후 package.json 버전 자동 +1
```

`--webpack` 플래그는 유지한다. Next.js 16은 `dev`/`build`가 Turbopack을 기본값으로 쓰는데,
옛 한글 경로에서 Turbopack이 패닉했던 게 원래 이유다(현재는 한글 없는 경로지만 webpack으로
검증돼 있으므로 그대로 둔다).

**Vitest 단위 테스트** — `npm test` (CI 모드) / `npm run test:watch` (워치). 현재 92 케이스, 모두 순수
함수 위주 — `buildPortfolio`, `analytics/*`, `equity-curve`, `csv`/`csv-import`, `searchSymbols`,
`avg-down`, `alerts/types`, `portfolio-health`. 컴포넌트 테스트는 없음 (Vitest config 도 `environment:
"node"`). UI 검증은 여전히 브라우저 기반. `next build` 는 TypeScript 체크를 수행하므로(통과 필수)
변경 후 한 번 돌리는 게 추가 안전망. ESLint 에러는 빌드를 막지 않는다 — CI 가 별도로 잡음
(`.github/workflows/ci.yml` 이 push/PR 마다 `tsc + lint + test`).

**변경사항은 `CHANGELOG.md` 에 기록.** 매 릴리스(`npm run release`) 마다 새 버전 entry 추가.
Keep a Changelog 형식.

## Project nature

개인용 주식/코인 **정보 대시보드**. **보조 모니터에 띄워두고** 매매 중 자산·시세·시장 정보를
보는 용도다. 장기 목표는 토스증권 OpenAPI 연동이지만, 그 전까지는 **가상 포트폴리오 + 라이브 공개
시세**로 동작한다. 대시보드/포트폴리오/거래/분석의 모든 값은 `lib/portfolio/sample-trades.ts`를
포트폴리오 엔진으로 리플레이한 결과를 Yahoo Finance 실시간 가격과 조인해 만든다.

**거래를 위한 프로그램이 아니다 (v0.21+ 명확화).** 사용자가 매수/매도 행위에 관여하는 UI 는
일체 없다. 거래 직접 추가·CSV 가져오기·+1주 빠른 매수·평단 낮추기 코치 같은 기능들은 v0.21에서
모두 제거됐다. 이유: ① 어디까지나 정보 제공이 본질, ② 거래 입력은 그만큼 보안 책임 가중. **유일한
예외는 모의 투자(PaperTrading)** — 시뮬레이션이고 실제 매매가 아니므로 유지. 향후 토스/KIS API
의 실거래 내역 자동 동기화가 들어올 때, 그건 "정보 표시" 영역이므로 추가 가능 — 단 사용자가 거래
입력 UI 를 직접 다루는 형태는 **앞으로도 추가하지 않는다.**

UI 언어는 한국어. 제품 문구에서 의도된 영어는 브랜드명 "Folio"뿐.

**핵심 철학: 최대한의 사용자 커스터마이즈.** 거의 모든 시각·동작 선택은 localStorage에 저장되는
토글 가능한 설정이어야 한다. 위젯 순서·그룹·표시 여부, 테마, 손익 색상 방향, 사이드바 위치,
화면 밀도, 갱신 주기, 표시 이름, 브로커 API 키 — 전부 이 패턴을 따른다. 새 UI도 맞춘다.

## Architecture

### 위젯 시스템 — 핵심 모델

라우트는 **하나뿐** (`src/app/(app)/page.tsx`). 페이지는 "섹션"이 아니라 **위젯**의 평면 목록이다.
(과거엔 섹션 기반이었으나 위젯 단위로 리팩터됨 — 섹션 관련 파일은 죽은 코드로 디스크에 남아있을 수 있다.)

흐름:
1. `(app)/page.tsx` (서버 컴포넌트, `force-dynamic`) — 데이터를 모두 fetch
   (`loadPortfolio`, `fetchMarketStrip`, `fetchHeatmap`, `fetchManyYahooQuotes`,
   `fetchSectorPerformance`).
2. `buildWidgetNodes(ctx)` (`components/widgets/widget-nodes.tsx`) — `Partial<Record<WidgetId,
   ReactNode>>` 를 만든다. 각 위젯 JSX를 서버에서 조립.
3. `<WidgetHost nodes={nodes} />` (`components/widgets/widget-host.tsx`, 클라이언트) — prefs
   순서대로 위젯을 렌더, dnd-kit으로 재배치.

위젯 레지스트리 (`src/lib/widgets/`):
- `types.ts` — `WidgetId`(전체 위젯 id의 유니온), `WidgetDef`, `GroupDef`.
- `registry.ts` — `WIDGETS` 배열(`id`, `label`, `defaultGroup`, `description`), `WIDGET_LABELS`, `WIDGET_BY_ID`.
- `groups.ts` — `DEFAULT_GROUP_ORDER`, `GROUP_META`(그룹별 라벨·아이콘), `defaultGroups()`,
  `DEFAULT_WIDGET_ORDER`, `iconForGroup()`, `labelForGroup()`.

`WidgetHost`:
- prefs `widgetOrder`(평면 페이지 순서) / `hiddenWidgets` / `widgetGroups`(사이드바 그룹 멤버십) 를 읽는다.
- **mounted 게이트** — SSR 직후엔 DnD 없이 맨 위젯만 렌더한다. dnd-kit의 `aria-describedby` id가
  서버/클라이언트 간 달라 hydration mismatch가 나기 때문. 마운트 후 DnD 셸로 교체된다.
- 마운트 시 `migrateWidgetSchema()` 실행 — `WIDGET_SCHEMA_VERSION`이 오르면 위젯 그룹·순서·숨김을
  현재 권장 구성으로 1회 리셋한다. 신규 사용자 기본값은 추천 위젯 11개 표시 + 13개 숨김
  (`PREF_DEFAULTS.hiddenWidgets`) — 숨긴 위젯은 설정에서 미리보기(`widget-preview-dialog.tsx`,
  위젯 이름 클릭) 후 추가한다. 카테고리는 8개(요약·보유 종목·손익 분석·거래 기록·모의 투자·시세·
  시장 동향·매매일지).
- 드래그 종료 시 `widgetOrder`를 갱신할 땐, `prev`에 없는(새로 추가된) 위젯도 `WIDGETS` 기준으로
  먼저 채운 "fullPrev"로 작업한다 — 안 그러면 새 위젯이 `indexOf === -1`로 드래그가 무시된다.

`WidgetFrame` (`components/widgets/widget-frame.tsx`) — 각 위젯을 감싼다:
- 박스 **바깥 우측 거터**(`absolute left-full`)에 hover 컨트롤: 그립(드래그)·숨기기(eye-off)·kebab.
  평소 ~20% 투명도, hover 시 100%.
- kebab → "그룹으로 이동" 팝오버.
- `data-widget`(위젯 id) + `data-section`(소속 그룹 id) 속성을 단다 — 스크롤 스파이가 읽는다.

### 위젯 추가하기

1. `src/lib/widgets/types.ts` 의 `WidgetId` 유니온에 새 id 추가.
2. `src/lib/widgets/registry.ts` 의 `WIDGETS` 에 `{ id, label, defaultGroup, description }` 추가
   (`description`은 위젯 미리보기 다이얼로그에 표시. `DEFAULT_WIDGET_ORDER`는 자동 파생).
3. `components/widgets/widget-nodes.tsx` 의 `buildWidgetNodes` 반환 객체에 `"<id>": <JSX/>` 추가.
   필요한 데이터는 `Ctx` 타입에 추가하고 `(app)/page.tsx`에서 fetch·전달.
4. **기본 레이아웃에 자동 노출되게 하려면 `WIDGET_SCHEMA_VERSION` 을 +1** (`preferences.ts`).
   `migrateWidgetSchema()` 가 한 번 실행돼 사용자 prefs 를 새 권장 구성으로 리셋. 안 올리면 기존
   사용자에겐 숨겨진 채로 추가됨(설정에서 켜야 보임).

### 데이터 흐름 (v0.21+ 단순화)

거래 입력 경로가 사라지면서 페이지는 **서버 → 위젯** 직선 흐름:

1. `(app)/page.tsx` (서버 컴포넌트, `force-dynamic`) 가 `loadPortfolio(account, kisCreds)` +
   strip·heatmap·sectors·watchlistQuotes 를 병렬 fetch.
2. `buildWidgetNodes(ctx)` 가 위젯 JSX 를 조립.
3. `<WidgetHost nodes={nodes} />` 가 prefs 순서대로 렌더.

이전(v0.11~v0.20) 에 있던 `PortfolioRoot` 클라이언트 wrapper — 사용자 직접 거래를 SAMPLE 과
합쳐 buildPortfolio 를 재실행하던 — 는 v0.21 에서 제거됐다. portfolio 는 서버에서만 계산하고
클라이언트는 표시만 한다.

### 내비게이션·스크롤

- 사이드바(`components/shell/sidebar-nav.tsx`)는 **그룹 트리** — 그룹 헤더(chevron 접기/펼치기 +
  아이콘 + 라벨), 펼치면 하위 위젯 앵커. 위젯을 그룹 내/그룹 간으로 드래그 가능. 빈 그룹도 사라지지
  않고 드롭 존을 보여준다. 그룹 내 위젯 순서는 `widgetOrder`(페이지 순서)를 따라 정렬된다.
- `useActiveSection()`(`[data-section]` 질의) — 현재 그룹. `useActiveWidget()`(`[data-widget]`) — 현재 위젯.
  둘 다 rAF 스로틀 스크롤 스파이, 뷰포트 상단 120px에 가장 가까운 요소를 고른다.
- `KeyboardNavHandler` — Arrow/Page Up·Down으로 위젯 단위 점프. 입력 요소·수정자 키 시 무시.
- `MouseGestureHandler` — 우클릭 후 위/아래로 드래그 시 페이지 맨 위/맨 아래로 이동(웨일식 제스처).
  제스처가 실제 발동했을 때만 컨텍스트 메뉴를 막는다.
- CSS `scroll-snap` 없음(시도 후 거부). `scroll-padding-top: 4rem`로 앵커 스크롤이 sticky 탑바를 비킨다.

### Preferences (localStorage 상태)

`src/lib/preferences.ts` + `src/hooks/use-preferences.ts` 의 `usePreference<T>(key, default)` —
`useState`를 `localStorage`의 `pref:<key>`에 미러. 크로스탭 `storage` 이벤트 + 같은탭
`preferences:change` 커스텀 이벤트로 동기화한다. **같은 키를 구독하는 컴포넌트들은 같은 탭에서도
즉시 동기화된다.** 재구현 시 커스텀 이벤트 채널을 반드시 보존할 것 — 없으면 "설정 바꿨는데 F5
전엔 다른 UI가 반응 안 함" 증상이 난다.

`writePref`는 `preferences:change` 디스패치를 `queueMicrotask`로 지연한다 — 다른 컴포넌트 렌더
도중 setState가 불리는 React 19 경고를 피하기 위함. 유지할 것.

키는 네임스페이스 구분: `global.*`, `layout.*`, `dashboard.*`, `portfolio.*`, `user.*`,
`journal.*`, `alerts.*`, `paper.*`. 항상 `PREF_KEYS`에서 키를 가져온다. 새 pref 추가: `PREF_KEYS` +
`PREF_DEFAULTS`에 추가 → 설정 Sheet에 UI 블록 → `usePreference(PREF_KEYS.x, PREF_DEFAULTS.x)`로 소비.

**`usePreference` 는 `useSyncExternalStore` 기반** — 무한 재렌더 방지를 위해 raw 문자열 기반
스냅샷 캐시를 둔다 (`use-preferences.ts`). 같은 raw 가 들어오면 같은 객체 참조를 돌려주므로
React 가 변경으로 오인하지 않음. `getServerSnapshot` 은 `defaultValue` 반환 (SSR 안전).

`<html>` 속성으로 내려야 CSS 셀렉터가 동작하는 prefs는 sync 컴포넌트가 따로 있다(root layout에 마운트):
`PnlDirectionSync`(→ `data-pnl-direction`), `DensitySync`(→ `data-density`). 제거하면 해당 토글이 깨진다.

### 자동 갱신

`components/shell/auto-refresh.tsx` (`(app)/layout.tsx`에 마운트) — `global.refreshInterval` pref
(30/60/300초, 0=수동)마다 `router.refresh()`를 호출해 서버 렌더 위젯 데이터를 새로 받는다. 탭이
숨겨졌을 땐 건너뛰고, 탭 복귀 시 1회 갱신. `router.refresh()`는 클라이언트 상태(드래그·prefs·위젯
순서)를 보존한다. 시세 섹션(`QuoteList`)은 이와 별도로 `/api/quotes`를 15초 폴링한다.

### 설정 Sheet & 보안 입력 패턴

사이드바 헤더의 톱니 아이콘이 우측 Sheet(`settings-button.tsx`)를 연다: 마이페이지 → 테마 →
손익 색상 → 레이아웃(사이드바 위치 + 화면 밀도) → 데이터 갱신(주기) → 위젯(숨김 토글) → 설정 백업.

**마이페이지 패널이 민감 입력의 표준 패턴.** API 키 필드는 의도적으로 여러 단계의 클릭 게이트로
보호한다(사용자가 라이브 방송/녹화 중일 수 있으므로). 명시적 지시 없이 완화하지 말 것:
1. Step 0 — 표시 이름만 보임. API 섹션은 점선 링크 "API 키 관리 (고급)". 키 폼 요소는 **DOM에 아예 없음**.
2. Step 1 (`ConfirmDialog` 동의 후) — 잠긴 API 카드 + 상태 배지만. 여전히 입력란 없음.
3. Step 2 (두 번째 `ConfirmDialog` 후) — 입력란 등장, 전부 `type="password"`.
4. 필드별 eye-reveal — 세 번째 `ConfirmDialog`(destructive) → 확인 시 **5초간 카운트다운과 함께
   평문** 후 자동 마스킹. 상수는 `REVEAL_TIMEOUT_MS`.
5. Sheet 언마운트(닫기) 시 Step 0로 리셋.

`ConfirmDialog`(`components/settings/confirm-dialog.tsx`)가 공용 게이트. 다른 보안 전환에도 재사용.
마이페이지는 `lib/brokers.ts`의 `BROKERS`를 순회해 브로커마다 키 카드를 렌더한다(현재 토스·한국투자).
브로커 추가는 `BROKERS`에 항목 + `PREF_KEYS`에 `user.<provider>.appKey`/`appSecret` 키를 더하면 된다.

**설정 백업** (`lib/settings-backup.ts` + `settings-backup-panel.tsx`) — 모든 `pref:*` 항목을 JSON
파일로 내보내고/가져온다. 앱 업데이트나 기기 이전 시 설정 보존용. 가져오기 후엔 페이지를 새로고침한다.

### 데이터 레이어

**Quote provider** (`src/lib/quotes/`):
- `yahoo.ts` — 코어. `fetchYahooChart(symbol, {range, interval})` → `{ meta, closes, timestamps }`.
  **반드시 실제 브라우저 User-Agent를 보낸다** — Node 기본 UA는 Yahoo가 차단. 실패 시 throw가
  아니라 `null` 반환.
- `symbols.ts` — `DEFAULT_WATCHLIST`(시세 위젯용 큐레이션) + `SYMBOL_CATALOG`(검색용 전체 유니버스
  — 한국·미국 대형주, 레버리지·인버스 ETF 포함). `SymbolEntry`의 `nameKo`·`aliases`로 한국어·별칭
  검색 지원. `findSymbol()`·`searchSymbols()`(티커/영문/한글 매칭) 제공. 캐노니컬 심볼(6자리 KR
  코드, US 티커) → Yahoo 심볼. KOSPI=`.KS`, KOSDAQ=`.KQ`.
- `indices.ts` — `fetchMarketStrip()` — 상단 지표 막대(코스피·코스닥·나스닥·S&P 500·USD/KRW).
- `heatmap.ts` — `fetchHeatmap()` — S&P 500 종목을 섹터로 묶은 데이터, 5분 캐시, 8개 배치 fetch.
  비어있지 않은 결과만 캐시. **d3 트리맵 위젯이 실제로 사용 중.**
- `sectors.ts` — `fetchSectorPerformance()` — 11개 SPDR 섹터 ETF(XLK 등)의 1년 일봉으로
  d1/w1/m1/m3/y1 기간 수익률을 산출. 5분 캐시.
- `/api/quotes`(시세 프록시 — 카탈로그에 없는 심볼은 raw Yahoo 심볼로 폴백), `/api/symbol-search`
  (Yahoo 종목 검색 — 모의 투자 위젯이 카탈로그 밖 종목까지 찾을 때) 서버 라우트가 Yahoo를
  프록시한다 — 클라이언트는 직접 upstream을 안 친다.

**증권사 연동** (`src/lib/brokers.ts`) — `BROKERS` 레지스트리(우선순위: 토스 > 한국투자(KIS)),
브로커별 `appKeyPref`/`secretPref`·`implemented` 플래그. `activeBroker()`가 입력된 키를 우선순위로
따져 활성 시세 소스를 정한다(키 없으면 Yahoo). 마이페이지가 브로커별 키 카드를, `QuoteList`가
활성 소스를 표시한다.

**한국투자증권(KIS)은 실연동돼 있다:**
- `lib/quotes/kis.ts` — KIS OpenAPI. OAuth 토큰을 appKey별로 메모리 캐시(24h 유효, 발행 1분당
  1회 제한이라 in-flight 공유). 국내주식 현재가(`inquire-price`)를 `Quote`로 매핑. KR 전용 —
  미국 실시간은 KIS 유료라 US는 항상 Yahoo.
- `lib/quotes/provider.ts` — `fetchQuotes(entries, kisCreds?)` 오케스트레이터. KIS 키가 있으면
  KR은 KIS, 그 외·실패분은 Yahoo. `loadPortfolio`·`/api/quotes` 둘 다 이걸 쓴다.
- **키 전달 경로:** 키는 브라우저 localStorage 에 있다 → `BrokerKeySync` 가 `POST /api/broker/keys`
  로 보내면 서버 라우트가 `Set-Cookie: HttpOnly; SameSite=Strict` 로 굽는다 →
  `broker-creds.ts#readKisCreds()` 가 서버 요청에서 읽는다. **HttpOnly 라 페이지의 어떤 JS 도
  쿠키를 읽지 못함** (XSS·CDN 침해 시에도 키 안 샘). 쿠키는 127.0.0.1 로컬에만 머문다.

토스는 키 입력 UI만 있고 실제 시세 호출은 미구현(`implemented` 플래그 false).

**Portfolio engine** (`src/lib/portfolio/service.ts`) — `buildPortfolio(trades, quotesBySymbol)`,
I/O 없는 순수 함수:
1. 거래를 `tradedAt` ASC, `id` ASC로 정렬(같은 날 결정적 순서).
2. 심볼별 상태로 리플레이 — **이동평균 원가** + **이중 KRW 트랙**: BUY/SELL마다 `costBasis`(시장
   통화)와 `costBasisKrw`(`trade.exchangeRate` 곱, KR은 1, US는 거래 시점 고정 환율) 둘 다 갱신.
3. SELL은 거래별 `realizedPnl`(시장 통화)·`realizedPnlKrw` 계산. 거래는 `avgPriceAfter`,
   `quantityAfter`, `realizedPnl`, `realizedPnlKrw`로 enrich되어 반환.
4. 남은 보유분을 시세와 조인 → `currentPrice`, `marketValueKrw`(= `qty × currentPrice ×
   avgExchangeRate`), `unrealizedPnlKrw`, `weight`, `todayChangeKrw`.

**핵심:** `marketValueKrw` 는 라이브 USD/KRW (`lib/quotes/fx.ts#fetchUsdKrw`) 로 환산하고,
실패 시 보유분의 원가 가중 `avgExchangeRate` 로 폴백. `investedKrw` (원가) 는 매수 환율 그대로
유지 — 이래야 미실현손익에 환차익/환차손이 정확히 반영된다. KR 종목엔 영향 없음(항상 1).

`src/lib/portfolio/server.ts#loadPortfolio(account?)` — 페이지가 호출할 유일한 진입점. 심볼 디듀프 →
Yahoo 시세 병렬 fetch → `buildPortfolio`. 의도적으로 캐시 안 함(매 요청 신선한 가격).

**계좌별 보기:** 거래에 `account`(`BrokerId`) 차원이 있다(`SAMPLE_TRADES`는 토스/한국투자로 분배,
한 종목의 매수·매도는 같은 계좌에 모음). `(app)/page.tsx`가 `?account=` 쿼리를 읽어
`loadPortfolio(account)`로 필터하고, 토스바의 `AccountSelector`(전체/토스/한국투자)가 그 쿼리를
바꾸면 포트폴리오 위젯 전체가 해당 계좌 기준으로 다시 그려진다. 시세·시장 위젯은 계좌 무관.
모의 투자 위젯은 별도 샌드박스(localStorage)라 계좌 필터와 무관하다.

**Analytics** (`src/lib/analytics/`) — 같은 `EnrichedTrade[]`/`Holding[]` 위의 순수 함수들:
- `service.ts` — `monthlyRealizedPnl`, `monthlyActivity`, `marketBreakdown`, `taxSimulation`
  (KR 무과세 가정, US `(realizedKrw − 2,500,000)+ × 22%`). 세금은 **시뮬레이션 전용** — UI마다
  disclaimer 유지.
- `trade-stats.ts` — `computeTradeStats`: Win Rate, 평균 수익률(매도가 vs 매도 직전 평단 기준),
  최고/최저 수익 종목(누적), 평균 보유 일수(매수→매도 차이).
- `portfolio-health.ts` — `diagnosePortfolio`: 집중도(top3 weight), 손실 비중, 종목 다변화, 지역
  분산(KR/US). 각 indicator 가 good/warning/danger + 종합 점수 0-100.


**Equity curve** (`src/lib/portfolio/equity-curve.ts`) — `generateEquityCurve(endValue, days,
seed=42)` — 오늘 `endValue`로 끝나는 결정적 합성 시계열. 고정 시드 + 역방향 워크라서 짧은 범위는
긴 범위의 마지막 N일과 정확히 일치(EquityChart 범위 전환 시 시각 연속성 유지). 일별 스냅샷이
생기면 이 파일 전체를 교체.

### 사용자가 입력하는 데이터 (일지·알림)

거래 입력은 없음 (v0.21 에서 제거). 사용자가 만드는 데이터는 정보성 2종 — 전부 localStorage:

- **매매일지** (`pref:journal.entries`, `Entry[]`): `JournalPanel` 위젯. 자유 형식 CRUD + 검색
  (제목·내용). 이전 버전의 거래 연결 기능은 제거됐지만 기존 entries 의 `tradeLabel` 필드는 데이터에
  남을 수 있다 (무시됨).
- **가격 알림** (`pref:alerts.priceAlerts`, `PriceAlert[]`): 종목별 상회/하회 목표가. `PriceAlertsPanel`
  (설정 Sheet) 에서 추가/삭제/재활성. `PriceAlertWatcher`(layout 마운트) 가 30s 마다 `/api/quotes` 로
  체크 → `alertHits()` 만족 시 (1) Notification API 데스크톱 알림, (2) `folio:alert-triggered` 이벤트
  → `AlertToast` 가 우상단 토스트 6s. 발동된 알림은 영구 비활성 (재설정 버튼으로 재활성).

### 레이아웃 오버레이 (`(app)/layout.tsx`)

`AppShell` 의 `overlays` 슬롯에 마운트되는 zero-render 핸들러들 — 각자 글로벌 사이드이펙트만 다룸:

- `HashScrollHandler` — 마운트 시 URL 해시로 스크롤
- `KeyboardNavHandler` — Arrow/Page 키로 위젯 점프
- `MouseGestureHandler` — 우클릭 드래그 위/아래 = 페이지 맨 위/아래
- `AppZoomHandler` — Ctrl+휠 / Ctrl+`+`/`-`/`0` 줌. **Electron 에선 `webFrame.setZoomFactor()` 네이티브,
  웹에선 `<main>` CSS `zoom` 폴백.** preload 의 `folioDesktop.setZoomFactor` 브리지 통해. 변경 시
  우상단에 "125%" 인디케이터 1.1s. (CSS `zoom` 을 `<html>` 에 적용하면 sticky 사이드바가 깨졌던
  v0.4 회귀를 v0.8 에서 이렇게 고침 — 다시 `<html>` 에 적용하지 말 것.)
- `AppShortcuts` — `/` (`[data-shortcut="trade-search"]` 포커스 + 스크롤). v0.21 에서 `n`
  (새 거래) 단축키는 거래 입력 경로와 함께 제거됨.
- `ShortcutsOverlay` — `?` 키로 모달 토글. `folio:open-shortcuts` 이벤트로도 열 수 있음 (설정 Sheet 의
  "키보드 단축키 보기" 링크가 사용).
- `BrokerKeySync` — `POST /api/broker/keys` 로 KIS 키를 HttpOnly 쿠키 굽기
- `UpdateBanner` — `electron-updater` 의 `update-downloaded` IPC 수신 → "지금 재시작" 배너
- `AutoRefresh` — `global.refreshInterval` 마다 `router.refresh()`
- `PriceAlertWatcher` + `AlertToast` — 가격 알림 폴링·표시

새 글로벌 핸들러를 추가할 땐 이 패턴 유지: "use client" + zero-render + window event/listener + layout 마운트.

### 키보드 단축키

| 키 | 동작 | 핸들러 |
|---|---|---|
| `↑` `↓` `PageUp` `PageDown` | 위젯/섹션 이동 | KeyboardNavHandler |
| 우클릭 + 위/아래 드래그 | 페이지 맨 위/맨 아래 | MouseGestureHandler |
| `Ctrl + 휠` / `Ctrl + +/-` / `Ctrl + 0` | 줌 | AppZoomHandler |
| `/` | 거래 검색 input 포커스 | AppShortcuts |
| `?` | 단축키 도움말 오버레이 | ShortcutsOverlay |
| `Esc` | 열린 모달 닫기 (HoldingHistoryModal · ShortcutsOverlay 등) | 각 모달 |
| `Ctrl + T` (데스크톱) | 항상 위에 표시 토글 | Electron 메뉴 accelerator |

### 시장 트리맵

`components/dashboard/market-heatmap.tsx` (d3-hierarchy 트리맵)가 **활성**. `fetchHeatmap()`의
Yahoo 데이터를 받아 SVG 트리맵을 직접 그린다(섹터 헤더 포함, `ResizeObserver` 반응형). `market-heatmap`
위젯 카드 헤더엔 수동 새로고침 버튼(`heatmap-refresh-button.tsx`, `router.refresh()`)이 있다.
`market-heatmap-tradingview.tsx`(TradingView 임베드)는 디스크에 남아있지만 미사용 — 서드파티
임베드라 조용히 멈추는 문제로 d3 버전으로 전환했다.

### Design tokens

`src/app/globals.css`가 단일 진실원천. Tailwind v4, `@theme inline`이 모든 `--*` CSS 변수를
유틸리티로 노출(`bg-pos`, `text-neg`, `bg-brand`, `bg-pos-soft` 등).
- OKLCH 팔레트. `--radius: 0.875rem`, Toss풍 soft 그림자(`--shadow-soft`, `--shadow-floating`).
- **손익 방향:** `--pos`/`--neg`가 `<html>`의 `[data-pnl-direction="eastern"]`로 뒤집힌다.
  컴포넌트에선 `text-pos`/`text-neg`/`bg-pos-soft` 등을 쓰고 초록/빨강을 하드코딩하지 말 것.
- **테마:** `.dark` 클래스(next-themes).
- **화면 밀도:** `html[data-density="compact"] { font-size: 13.5px }` — rem 기반 UI 전체가 축소.
- `.tabular` 유틸리티를 모든 금액 표시에 쓴다.
- Pretendard 는 **`public/fonts/PretendardVariable.woff2` 단일 VF 파일** 로 self-host
  (`globals.css` 의 `@font-face`). npm 패키지(99MB 통째 번들 → 인스톨러 +60MB) 대신 2MB VF 한 개만
  포함. CDN 의존성 없고 인스톨러 크기 영향 최소. sans 에 `next/font` 다시 도입하지 말 것.

### shadcn/ui — Radix가 아니라 Base UI

`components.json` 스타일 `base-nova` — `@base-ui/react`에서 import(`@radix-ui/*` 아님). API가 다름:
- `PopoverTrigger`/`SheetTrigger`/`DialogTrigger` 등은 자체 `<button>`을 렌더한다. 안에 `<button>`을
  `asChild`로 중첩하지 말 것 — `asChild` 미지원, nested-button hydration 에러. className/aria는
  Trigger에 직접.
- Sheet/Dialog/Popover 모두 `@base-ui/react/dialog` 기반. 중첩(Sheet 안 Dialog) 정상 동작.
- 컴포넌트 추가는 `npx shadcn@latest add <name>`로 — 생성기가 `base-nova` 구현을 고르도록.

### Recharts는 CSS 변수를 못 읽음

`stroke="var(--brand)"`는 SVG에 문자열 그대로 들어가 안 보인다. 차트는 `useChartTokens()`
(`src/hooks/use-chart-tokens.ts`)로 런타임에 토큰을 해석한다 — `getComputedStyle`로 읽고
`MutationObserver`로 테마/손익방향 변화를 구독, `{ brand, pos, neg, grid, axis, surface, text,
palette[] }` 반환. recharts props(`stroke`, `fill`, `<Cell fill={...}/>`)에 넘긴다.
`ResponsiveContainer`는 SSR 중 측정 불가라 `width(-1)/height(-1)` 경고를 낸다 — 거슬리면 `mounted`
게이트로 차트 본문을 감싼다(해롭진 않음).

## 데스크톱 앱 (Electron)

이 앱의 배포 형태는 **로컬 데스크톱 프로그램**이다(웹 호스팅 없음 → 운영자가 개인정보를 보관할
일이 없음). 사용자 데이터는 전부 그 사람 PC의 localStorage / Electron `userData`에만 있다.

- `electron/main.js` — Next.js standalone 서버를 **고정 포트 42813**으로 자식 프로세스로 띄우고
  (`ELECTRON_RUN_AS_NODE`), 준비되면 BrowserWindow로 로드. 포트 고정 = origin 고정 = localStorage가
  재실행해도 유지. 창 크기·위치, "항상 위에 표시"(Ctrl+T)를 `userData/window-state.json`에 저장.
  `electron-updater`로 자동 업데이트(시작 시 + 6시간마다 확인, 실패는 조용히 무시).
- `next.config.ts`에 `output: "standalone"` — standalone 번들을 만든다.
- `package.json`의 `build`(electron-builder) 설정 — 건드릴 때 주의:
  - `extraResources`에 `.next/standalone/node_modules` → `app/node_modules` **명시 항목이 필수**.
    electron-builder는 디렉터리 복사 시 `node_modules`를 빼먹는다 — 빠지면 패키지된 앱이 `next`
    모듈을 못 찾아 서버가 안 뜨고 **검은 화면**이 된다.
  - `toolsets.winCodeSign: "1.1.0"` — 레거시 winCodeSign `.7z`에는 macOS 심볼릭 링크가 들어있어
    심볼릭 링크 생성 권한이 없으면 압축 해제가 실패한다. 모던 toolset은 Windows용 `.zip`만 받는다.
  - `publish`: GitHub `Gosim522/folio`, `releaseType: "release"`.
  - `nsis.deleteAppDataOnUninstall: false` — 제거해도 사용자 설정 보존.

**릴리스 절차:** `GH_TOKEN` 환경변수(repo 권한 토큰)를 한 번 설정해두면, 이후엔 `npm run release`
한 줄로 — 현재 `package.json` 버전을 빌드·GitHub Releases 발행(설치 파일·`latest.yml`·blockmap) 후
`package.json` 버전을 다음 작업용으로 자동 +1 한다(`scripts/release.ps1`, 기본 minor;
`npm run release -- -Patch`로 patch). `release.ps1`은 `GH_TOKEN`을 사용자 환경변수에서도 직접 읽어
setx 후 새 터미널을 열 필요가 없다. 기존 사용자 앱은 `electron-updater`가 `latest.yml`을 읽어 자동
업데이트한다. 발행 없이 백업만 필요하면 `npm run backup`(버전증가 zip + 로컬 `desktop:build`).

## Common pitfalls

- **electron-builder가 node_modules를 누락** — `extraResources`에 `.next/standalone/node_modules`
  명시 항목 없으면 패키지 앱이 검은 화면. (위 데스크톱 섹션 참조)
- **winCodeSign 심볼릭 링크 권한 오류** — `toolsets.winCodeSign`을 모던 버전으로 지정해 회피.
- **Yahoo가 기본 fetch UA를 차단** — `fetchYahooChart`가 실제 브라우저 UA를 보낸다. 제거 금지.
- **Recharts CSS 변수** — 항상 `useChartTokens()`, `var(--brand)` 인라인 금지.
- **Base UI `Trigger asChild` + 중첩 `<button>`** — nested-button hydration 에러. Trigger에 직접 스타일.
- **`force-dynamic`** — 루트 페이지에 필수. 없으면 빌드 시점에 시세가 박제된다.
- **dnd-kit hydration mismatch** — `WidgetHost`는 mounted 게이트로 SSR 시 DnD를 렌더하지 않는다.
  드래그·재배치 로직을 만질 땐 이 패턴을 유지.
- **새 위젯 드래그가 무시됨** — 드래그 핸들러에서 저장된 `widgetOrder`에 없는 위젯은
  `indexOf === -1`이 된다. `WIDGETS` 기준 "fullPrev"로 보강한 뒤 재배치할 것.
- **localStorage SSR 깜빡임** — 초기 페인트는 기본값, `usePreference` 하이드레이션 후 사용자값으로
  재렌더(1프레임 깜빡임). 레이아웃/순서/표시 여부엔 허용.
- **React 트리 안의 `<script>`** — React 19는 JSX 내 `<script>`에 경고한다. 필요하면 `useEffect`
  안에서 `document.createElement("script")`로 주입.
- **보안 입력** — API 키 입력란을 기본 노출 금지. `my-page-panel.tsx`의 3단계 공개 + ConfirmDialog
  + 5초 자동 마스킹 패턴을 따르고, Sheet 언마운트 시 상태 리셋.
- **`scripts/*.ps1` 은 UTF-8 BOM 필수** — PS 5.1 의 기본 인코딩이 시스템 코드페이지(한국 윈도우=CP949)라,
  BOM 없는 UTF-8 파일을 CP949 로 잘못 읽어 한글 경로(`개인 프로젝트/A. Backup/...`)가 깨지고
  `Get-ChildItem` 이 빈 결과를 반환한다. 결과: backup 이 v0.1 부터 다시 시작하거나 zip 생성이 실패.
  편집기에서 저장 시 "UTF-8 with BOM" 옵션 유지. 또한 스크립트 안에서 `Get-Content -Raw`로 한글
  포함 JSON 을 읽으면 같은 이유로 파싱 실패 → `[IO.File]::ReadAllText(path, [Text.Encoding]::UTF8)` 사용.

## 다음 버전 과제 (해결하면 이 목록에서 지울 것)

향후 릴리스에서 처리할 알려진 문제. **항목을 실제로 고치면 여기서 삭제한다.**

1. **코드 서명 인증서** — 빌드가 신뢰된 인증서로 서명되지 않아 설치 시 Windows SmartScreen
   경고가 뜬다. electron-builder는 `CSC_LINK`(.pfx 인증서 경로/URL) + `CSC_KEY_PASSWORD`
   환경변수가 있으면 자동으로 서명한다 — **코드 변경은 필요 없고, 코드 서명 인증서 발급(유료,
   표준 또는 EV)만 하면 된다.** EV 인증서는 SmartScreen 평판을 즉시 통과한다.
2. **인앱 업데이트 배너·앱 아이콘 패키지 빌드 시각 검증** — 정적 체크만 했고 실제 패키지 앱에서
   아이콘/배너가 보이는지 한 번 본격 검증 필요. (사용자가 v0.x → v0.y 자동 업데이트 받을 때 확인)
