# Folio

보조 모니터에 띄워두는 **개인용 트레이딩 대시보드**. 매매하는 동안 내 자산·시세·시장 정보를
한 눈에 보여주며, 위젯 단위로 거의 모든 것을 커스터마이즈할 수 있습니다.

- **정보 제공 전용** — 보조 모니터에 띄워두고 보는 대시보드. 매수/매도 행위에 관여할 수 있는 UI 는
  의도적으로 두지 않습니다 (모의 투자 제외). 향후 API 자동 연동의 정보 표시 영역으로 확장 예정.
- **위젯 단위 자유 배치** — 페이지/사이드바에서 드래그, 그룹 이동, 숨김·미리보기
- **분석 위젯** — 자산 요약·홀딩 테이블·이번 달 요약·거래 통계·포트폴리오 진단 등
- **라이브 시세** — KIS API 키 입력 시 한국주식은 한국투자증권 OpenAPI, 그 외/미국은 Yahoo Finance
- **개인정보는 서버에 저장하지 않음** — 설정·일지·API 키 모두 사용자 기기에만 (KIS 키는 서버
  HttpOnly 쿠키로만 굽힘)

## 빠른 시작

데스크톱 앱 설치: [GitHub Releases](https://github.com/Gosim522/folio/releases) 에서
`Folio Setup x.y.z.exe` 다운로드 → 설치 → 자동 업데이트로 신규 버전 받음.

개발자 로컬:

```powershell
npm install
npm run dev               # http://localhost:3000
npm run electron          # 별도 터미널 — 데스크톱 앱 실행 (dev 서버 먼저 떠야 함)
npm test                  # vitest — 90+ 단위 테스트
npm run desktop:build     # Folio Setup x.y.z.exe 빌드 (업로드 X)
npm run release           # 빌드 + GitHub Releases 업로드 + 자동 백업 + 버전 +1
```

상세 build/dev 설명·아키텍처: [`CLAUDE.md`](./CLAUDE.md)
버전별 변경사항: [`CHANGELOG.md`](./CHANGELOG.md)

## 주요 기능 (v0.21 기준)

### 포트폴리오 & 보유종목
- **자산 요약** · 총 KPI · 평가금액(라이브 USD/KRW 환산) · 손익 그래프
- **보유 종목 테이블** — 종목명 클릭 시 매매 히스토리 모달 (평단 변화·누적 실현손익)
- **포트폴리오 진단** — 집중도·손실 비중·다변화 종합 점수 (0-100)
- **종목 비중 도넛** · **시장별 분포** (KR/US) · **달러 환차손익**

### 거래 내역 & 일지
- **거래 내역 표시** (read-only) — SAMPLE_TRADES 기반, 향후 API 동기화 자리
- **CSV 내보내기** — 엑셀 호환(UTF-8 BOM)
- **거래 검색·필터·정렬** — 종목/메모 검색, 매수·매도/시장/시간·금액·실현손익 정렬
- **매매일지** — 자유 형식 메모, 검색

### 분석
- **이번 달 요약 카드** · **거래 통계** (Win Rate, 평균 수익률, 최고/최저 종목, 평균 보유 기간)
- **세금 시뮬레이션** (US 양도세 22%, KR 비과세 가정) · **월별 실현손익** · **활동 그래프** ·
  **시장 분포** 차트

### 시세 & 시장
- **마켓 스트립** — 코스피·코스닥·나스닥·S&P 500·USD/KRW (스파크라인)
- **시장 지도** — TradingView 임베드 (S&P 500 sectorized heatmap)
- **워치리스트** · **경제 일정** · **시장 시계** · **섹터 성과**

### 알림 & 단축키
- **가격 알림** — 종목별 상회/하회 목표가, 30초 폴링, 데스크톱 알림 + 인앱 토스트
- **`?`** — 키보드 단축키 도움말 오버레이
- **`Ctrl + 휠 / + / - / 0`** — Electron 네이티브 줌 (배율 인디케이터 표시)
- **`/`** — 거래 검색 포커스
- **`↑ ↓ PageUp PageDown`** — 섹션 이동
- **우클릭 + 마우스 위/아래** — 맨 위/맨 아래 (웨일 스타일)
- **`Ctrl + T`** — 항상 위에 표시 (데스크톱)

### 설정 & 데이터
- **테마** (라이트/다크/시스템) · **손익 색상 방향** (한국/서양) · **사이드바 위치** · **밀도**
- **위젯 관리** — 드래그로 그룹 이동, 숨김, 미리보기, 그룹 커스터마이징
- **계좌별 보기** — 전체 / 토스 / 한국투자 (URL `?account=...`)
- **설정 백업/복원** — 모든 설정·일지·알림을 JSON 파일로 export/import
- **자동 업데이트** — 신규 버전 다운로드 후 인앱 배너로 "지금 재시작" 안내

## 데스크톱 앱 동작 방식 (`electron/main.js`)

- 내부적으로 Next.js standalone 서버를 **고정 포트 42813** 으로 띄우고 그 창을 엽니다.
  포트가 고정이라 페이지 origin 이 항상 같고, `localStorage` 설정이 재실행해도 유지됩니다.
- 창 크기·위치·**최대화 상태**·"항상 위에 표시" 를 기억합니다.
- 외부 링크는 시스템 브라우저로 엽니다.
- **자동 업데이트**: GitHub Releases 의 새 버전을 백그라운드로 받아 인앱 배너로 알림.

### 업데이트해도 데이터가 안 날아가는 이유

- 사용자 설정은 Electron 의 `userData` 폴더(`%APPDATA%/Folio/`) 에 저장됩니다.
- 설치 파일의 `appId`(`com.folio.dashboard`) 가 동일하면 새 버전 설치해도 이 폴더는 보존.
- 추가 안전장치로 **설정 → 설정 백업**에서 모든 데이터를 JSON 으로 내보내고 가져올 수 있어요.

## 보안

- **API 키 (KIS 등)** 는 클라이언트 localStorage 에 저장 → `BrokerKeySync` 가 `POST /api/broker/keys`
  로 서버에 보내면 서버 라우트가 `Set-Cookie: HttpOnly; SameSite=Strict` 로 굽힙니다.
  **JS 가 직접 쿠키를 읽지 못해** XSS·CDN 침해 시에도 키가 새지 않는 구조.
- 모든 폰트·라이브러리 self-host (Pretendard VF 포함, CDN 의존성 0).
- 서버가 외부와 통신하는 건 시세 데이터 (Yahoo / KIS) 뿐 — 사용자 데이터를 외부로 보내지 않음.

## 기술 스택

Next.js 16 (webpack — 한글 경로 Turbopack 패닉 회피) · React 19 · TypeScript · Tailwind v4 ·
shadcn/ui (base-nova) · Recharts · Electron 42 · electron-updater · electron-builder · Vitest

> **작업 경로** — 이 프로젝트의 정식 위치는 `C:\Users\user\Desktop\folio` 입니다.
> electron-builder 가 경로에 한글이 있으면 패키징이 실패하므로 한글 없는 이 경로에서
> 작업·빌드해야 합니다. (`개발 중_Folio` 는 옛 위치, 사용 X)

## 라이선스 · 기여

개인 프로젝트. PR/Issue 환영. CI 는 `tsc + eslint + vitest` 를 push/PR 마다 자동 실행
(`.github/workflows/ci.yml`).
