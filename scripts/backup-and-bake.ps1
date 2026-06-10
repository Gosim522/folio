<#
  Folio — 개발 백업 + 데스크톱 빌드("굽기")를 한 번에.

  백업 폴더에서 최신 Backup_Folio_vMAJOR.MINOR.zip 을 찾아 MINOR 를 +1 한
  새 버전으로 백업한 뒤, npm run desktop:build 를 실행한다.
  백업 zip 은 node_modules / .next / dist-electron 을 제외하고 .git 은 포함하며,
  표준(슬래시 구분자) zip 으로 만든다.

  사용법:
    npm run backup              # 버전 +1 백업 후 데스크톱 빌드
    npm run backup -- -NoBuild  # 백업만 (빌드 건너뜀)
#>
param([switch]$NoBuild)

$ErrorActionPreference = "Stop"
# 콘솔/파이프 출력 인코딩을 UTF-8 로 — 백그라운드 캡처·CI 로그에서 한글이 깨지지 않도록.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$projectRoot = "C:\Users\user\Desktop\folio"
$backupDir   = "C:\Users\user\Desktop\개인 프로젝트\A. Backup\Folio Backup"

# --- 1. 다음 백업 버전 계산 -------------------------------------------------
$latest = Get-ChildItem -Path $backupDir -Filter "Backup_Folio_v*.zip" -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($_.Name -match 'Backup_Folio_v(\d+)\.(\d+)\.zip') {
      [pscustomobject]@{ Major = [int]$Matches[1]; Minor = [int]$Matches[2] }
    }
  } | Sort-Object Major, Minor | Select-Object -Last 1

if ($latest) {
  $major = $latest.Major
  $minor = $latest.Minor + 1
} else {
  $major = 0
  $minor = 1
}
$name    = "Backup_Folio_v$major.$minor"
$zipPath = Join-Path $backupDir "$name.zip"
Write-Host "[backup] 새 버전: $name"

# --- 2. 스테이징 (빌드 산출물·의존성 제외, .git 포함) ----------------------
$staging = Join-Path $env:TEMP "folio-backup-stage"
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
$inner = Join-Path $staging $name
$null  = New-Item -ItemType Directory -Path $inner -Force
# /XD: 의존성·빌드 산출물 폴더 제외
# /XF: 혹시 모를 비밀 파일(.env, 인증서 등) 제외 — 백업에 시크릿이 절대 안 섞이게.
robocopy $projectRoot $inner /E `
  /XD (Join-Path $projectRoot "node_modules") `
      (Join-Path $projectRoot ".next") `
      (Join-Path $projectRoot "dist-electron") `
  /XF ".env" ".env.*" "*.pem" "*.key" "*.pfx" "*.p12" `
  /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 실패 (코드 $LASTEXITCODE)" }

# --- 3. 표준 zip 생성 (슬래시 구분자) --------------------------------------
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
$archive = [System.IO.Compression.ZipFile]::Open(
  $zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $base = $staging.TrimEnd('\') + '\'
  Get-ChildItem -Path $staging -Recurse -File -Force | ForEach-Object {
    $rel = $_.FullName.Substring($base.Length) -replace '\\', '/'
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $archive, $_.FullName, $rel)
  }
} finally {
  $archive.Dispose()
}
Remove-Item -Recurse -Force $staging
$kb = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host "[backup] 완료 -> $zipPath ($kb KB)"

# --- 4. 데스크톱 빌드 ("굽기") ---------------------------------------------
if ($NoBuild) {
  Write-Host "[build] -NoBuild 지정 — 빌드를 건너뜁니다."
  return
}
# 실행 중인 dev 서버가 있으면 종료 — next build 가 .next 를 두고 충돌하는 것을 막는다.
$devConn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($devConn) {
  $devPid = ($devConn | Select-Object -First 1).OwningProcess
  taskkill /F /T /PID $devPid | Out-Null
  Write-Host "[build] 포트 3000 dev 서버(PID $devPid) 종료 — 빌드 충돌 방지"
}
Write-Host "[build] npm run desktop:build 시작..."
Set-Location $projectRoot
& npm run desktop:build
if ($LASTEXITCODE -ne 0) { throw "desktop:build 실패 (코드 $LASTEXITCODE)" }
Write-Host "[build] 완료."
