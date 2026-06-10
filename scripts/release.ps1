<#
  Folio — 데스크톱 앱 배포 자동화.

  package.json 의 현재 버전을 빌드해 GitHub Releases 에 발행하고,
  발행이 끝나면 다음 작업을 위해 버전을 한 단계 올려 둔다.
  → 설치된 구버전 앱들이 발행 직후 자동 업데이트를 감지한다.

  사용법:
    npm run release             # 현재 버전 발행 후 minor +1
    npm run release -- -Patch   # 발행 후 patch +1
#>
param([switch]$Patch)

$ErrorActionPreference = "Stop"
# 콘솔/파이프 출력 인코딩을 UTF-8 로 — 백그라운드 캡처·CI 로그에서 한글이 깨지지 않도록.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$projectRoot = "C:\Users\user\Desktop\folio"
Set-Location $projectRoot

# --- 1. GitHub 발행 토큰 확인 ----------------------------------------------
# 프로세스 환경변수에 없으면 사용자 영구 환경변수(레지스트리)에서 직접 읽는다.
# → setx 직후 같은 터미널에서 바로 실행해도 동작한다 (새 창 불필요).
if (-not $env:GH_TOKEN) {
  foreach ($name in "GH_TOKEN", "GITHUB_TOKEN") {
    $stored = [Environment]::GetEnvironmentVariable($name, "User")
    if ($stored) { $env:GH_TOKEN = $stored; break }
  }
}
if (-not $env:GH_TOKEN) {
  Write-Host ""
  Write-Host "[release] 중단 — GitHub 발행 토큰(GH_TOKEN)이 없습니다." -ForegroundColor Red
  Write-Host "  한 번만 설정하면 됩니다 (새 터미널 열 필요 없음):"
  Write-Host "   1) https://github.com/settings/tokens/new 에서 'repo' 권한 토큰 발급"
  Write-Host '   2) 같은 터미널에서:  setx GH_TOKEN "발급받은_토큰값"'
  Write-Host "   3) 곧바로  npm run release"
  Write-Host ""
  exit 1
}

# --- 2. 현재 버전 발행 (빌드 + GitHub 업로드) ------------------------------
# package.json 은 BOM 없는 UTF-8. PS 5.1 Get-Content -Raw 는 시스템 코드페이지
# (한국 윈도우는 CP949)로 읽어 한글 description 이 깨지고 JSON 파싱이 실패한다.
function Read-PackageVersion {
  $raw = [System.IO.File]::ReadAllText(
    (Join-Path $projectRoot "package.json"),
    [System.Text.Encoding]::UTF8)
  return ($raw | ConvertFrom-Json).version
}
$version = Read-PackageVersion
Write-Host "[release] v$version — 빌드 + GitHub 발행 시작..." -ForegroundColor Cyan

# --- 2a. 백업 (빌드 전, 발행될 버전 상태로 zip) ---------------------------
# backup-and-bake.ps1 에 -NoBuild 를 주면 백업만 만든다.
# 빌드 전에 잡아둬야 빌드/업로드가 실패해도 소스 스냅샷이 남는다.
Write-Host "[release] 백업 zip 생성 중..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $projectRoot "scripts\backup-and-bake.ps1") -NoBuild
if ($LASTEXITCODE -ne 0) { throw "backup 실패 (코드 $LASTEXITCODE)" }

# 실행 중인 dev 서버가 있으면 종료 — next build 가 .next 를 두고 충돌하는 것을 막는다.
$devConn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($devConn) {
  $devPid = ($devConn | Select-Object -First 1).OwningProcess
  taskkill /F /T /PID $devPid | Out-Null
  Write-Host "[release] 포트 3000 dev 서버(PID $devPid) 종료 — 빌드 충돌 방지"
}

& npm run desktop:release
if ($LASTEXITCODE -ne 0) { throw "desktop:release 실패 (코드 $LASTEXITCODE)" }
Write-Host "[release] v$version 발행 완료 — 설치된 앱이 곧 자동 업데이트를 감지합니다." -ForegroundColor Green

# --- 3. 다음 작업용으로 버전 자동 증가 -------------------------------------
$bump = if ($Patch) { "patch" } else { "minor" }
& npm version $bump --no-git-tag-version | Out-Null
if ($LASTEXITCODE -ne 0) { throw "버전 증가 실패 (코드 $LASTEXITCODE)" }
$next = Read-PackageVersion
Write-Host "[release] package.json 을 다음 작업용 v$next 로 올려뒀습니다."
