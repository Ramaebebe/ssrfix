param([switch]$DryRun)

function Write-Section($m){Write-Host "== $m ==" -ForegroundColor Cyan}
function Write-Info($m){Write-Host $m -ForegroundColor Green}
function Write-Warn($m){Write-Host $m -ForegroundColor Yellow}
function Write-Err($m){Write-Host $m -ForegroundColor Red}

Write-Section "1) Node version check (.nvmrc)"
$nodeVersion = (& node -v) 2>$null
if (-not $nodeVersion){ Write-Err "Node is not installed. Install Node 18.20.3." ; exit 1 }
$nvmrcPath = Join-Path $PWD ".nvmrc"
if (Test-Path $nvmrcPath) {
  $requiredNode = (Get-Content $nvmrcPath).Trim()
} else { $requiredNode = "18.20.3" }

if ($nodeVersion.StartsWith("v$requiredNode")) {
  Write-Info "Node version is correct: $nodeVersion"
} else {
  Write-Warn "Project requires Node $requiredNode, but found $nodeVersion"
  Write-Warn "If using nvm-windows: nvm install $requiredNode; nvm use $requiredNode"
  try { volta pin node@$requiredNode } catch { Write-Warn "Volta pin failed or not installed." }
}

Write-Section "2) OneDrive check"
if ($PWD.Path -like "*OneDrive*") {
  Write-Warn "Project path under OneDrive can break Next.js builds. Consider moving to C:\Dev\afriportal"
}

Write-Section "3) WSL check"
try {
  $wslStatus = wsl.exe --status
  if ($wslStatus) {
    Write-Info "WSL detected. For best perf: run inside WSL2."
    Write-Host "wsl --cd $PWD" -ForegroundColor Green
  }
} catch {}

Write-Section "4) Install deps"
if (-not $DryRun){ npm ci } else { Write-Info "[dry-run] npm ci" }

Write-Section "5) Env template"
$envExample = @"
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
STORAGE_BUCKET_QUOTES=quotes
STORAGE_BUCKET_AUDIT_PHOTOS=audit-photos

NEXT_PUBLIC_ANALYTICS_URL=
NEXT_PUBLIC_ANALYTICS_URL_2=
"@
if (-not (Test-Path ".\.env.example")) { if (-not $DryRun){ $envExample | Set-Content ".\.env.example" } else { Write-Info "[dry-run] write .env.example" } }
if (-not (Test-Path ".\.env.local")) { if (-not $DryRun){ Copy-Item .\.env.example .\.env.local } else { Write-Info "[dry-run] copy .env.local" } }

Write-Section "6) Post bootstrap"
if (-not $DryRun){
  npx next telemetry disable | Out-Null
} else { Write-Info "[dry-run] next telemetry disable" }

Write-Section "7) Build (no lint)"
Write-Info "If CI: add 'npm run build -- --no-lint' step for speed"
Write-Info "Done. Use 'npm run dev' to start."
