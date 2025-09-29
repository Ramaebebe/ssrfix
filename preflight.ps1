function Write-Err($m){Write-Host $m -ForegroundColor Red}

# Node check via .nvmrc
$nodeVersion = (& node -v) 2>$null
if (-not $nodeVersion) { Write-Err "Node is not installed"; exit 1 }
if (Test-Path .\.nvmrc) {
  $nvmrc = (Get-Content .\.nvmrc) -join "" | ForEach-Object { $_.Trim() }
  if (-not $nodeVersion.StartsWith("v$nvmrc")) {
    Write-Err "Node version mismatch. Need $nvmrc, got $nodeVersion"
    exit 1
  }
}

# Ensure TypeScript exists
$npxTsc = (& npx --yes typescript@5.5.4 -v) 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Err "Unable to run TypeScript via npx."
  exit 1
}

# Type-check (no emit)
npx --yes tsc --noEmit
if ($LASTEXITCODE -ne 0) { Write-Err "TypeScript errors found"; exit 1 }

# Env vars required for Next app to boot/use Supabase
if ([string]::IsNullOrWhiteSpace($env:NEXT_PUBLIC_SUPABASE_URL)) { Write-Err "Missing NEXT_PUBLIC_SUPABASE_URL"; exit 1 }
if ([string]::IsNullOrWhiteSpace($env:NEXT_PUBLIC_SUPABASE_ANON_KEY)) { Write-Err "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"; exit 1 }
