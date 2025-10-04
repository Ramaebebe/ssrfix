param([switch]$DryRun)

# -----------------------------
# Logging helpers
# -----------------------------
function Write-Section($m){ Write-Host "== $m ==" -ForegroundColor Cyan }
function Write-Info($m){ Write-Host $m -ForegroundColor Green }
function Write-Warn($m){ Write-Host $m -ForegroundColor Yellow }
function Write-Err($m){ Write-Host $m -ForegroundColor Red }

# Stamp used for backup dir and zip name (defined once)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Root directory and validity check
$repoRoot = (Get-Location).Path
Write-Info "Repo root: $repoRoot"

# -----------------------------
# Exclusion configuration (must be defined before functions)
# -----------------------------
# Root-level folders to exclude entirely
$excludeRoots = @(".git", "node_modules", ".next", ".vercel", "dist", "coverage")
# File/folder patterns (any depth) to exclude
$excludePatterns = @(
  "^\.git($|\\.*)",            # .git and everything under it
  "^node_modules($|\\.*)",     # node_modules and everything under it
  "^\.next($|\\.*)",           # .next and everything under it
  "^\.vercel($|\\.*)",         # .vercel and everything under it
  "^dist($|\\.*)",             # dist and everything under it
  "^coverage($|\\.*)"          # coverage and everything under it
)

# -----------------------------
# Helper functions (defined early; rely on globals above)
# -----------------------------

# Normalize path relative to current working directory
function Normalize-RelPath([string]$path) {
    # Return path relative to repo root
    return $path.Substring((Get-Location).Path.Length + 1).TrimStart('\','/')
}

# Predicate: should a relative path be excluded?
function Should-Exclude([string]$relativePath) {
    # If first path segment is in $excludeRoots, skip
    $firstSeg = $relativePath -split "[\\/]" | Select-Object -First 1
    if ($excludeRoots -contains $firstSeg) { return $true }

    # Also check regex patterns that match "folder or any subpath"
    foreach ($regex in $excludePatterns) {
        if ($relativePath -match $regex) { return $true }
    }
    return $false
}

# Recursive copy with pruning (skip excluded paths)
function Copy-WithPrune([string]$src, [string]$tmpRoot) {
    $rel = Normalize-RelPath $src
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "." }

    if (Should-Exclude $rel) { return }

    $dst = Join-Path $tmpRoot $rel

    if (Test-Path $src -PathType Container) {
        if (-not (Test-Path $dst)) {
            if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $dst | Out-Null }
            else { Write-Info "[dry-run] mkdir $dst" }
        }
        Get-ChildItem -LiteralPath $src -Force | ForEach-Object {
            Copy-WithPrune -src $_.FullName -tmpRoot $tmpRoot
        }
    } else {
        $dir = Split-Path $dst
        if (-not (Test-Path $dir)) {
            if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
            else { Write-Info "[dry-run] mkdir $dir" }
        }
        if (-not $DryRun) { Copy-Item -Force $src $dst }
        else { Write-Info "[dry-run] copy $src -> $dst" }
    }
}

# Safe replace-write with backup
function Set-FileContent([string]$Path, [string]$Content, [string]$BackupDir) {
    $dir = Split-Path $Path
    if (-not (Test-Path $dir)) {
        if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        else { Write-Info "[dry-run] mkdir $dir" }
    }

    if (Test-Path $Path) {
        $backupPath = Join-Path $BackupDir (Split-Path -Leaf $Path)
        if (-not $DryRun) { Copy-Item -Force $Path $backupPath }
        else { Write-Info "[dry-run] backup $Path -> $backupPath" }
    }

    if (-not $DryRun) { Set-Content -Encoding UTF8 -Path $Path -Value $Content }
    else { Write-Info "[dry-run] write $Path" }
}

# -----------------------------
# Section 1: Node version check from .nvmrc
# -----------------------------
Write-Section "1) Node version check (.nvmrc)"
$nodeVersion = (& node -v) 2>$null
if (-not $nodeVersion) {
  Write-Err "Node is not installed. Please install Node 18.20.3 (or use nvm-windows)."
} else {
  $nvmrcPath = Join-Path $repoRoot ".nvmrc"
  $requiredNode = if (Test-Path $nvmrcPath) { (Get-Content $nvmrcPath).Trim() } else { "18.20.3" }

  if ($nodeVersion.StartsWith("v$requiredNode")) {
    Write-Info "Node version is correct: $nodeVersion"
  } else {
    Write-Warn "Project recommends Node $requiredNode, but found $nodeVersion"
    Write-Warn "If using nvm-windows: nvm install $requiredNode; nvm use $requiredNode"
    Write-Warn "Or install Volta and pin with: volta pin node@$requiredNode"
  }
}

# -----------------------------
# Section 2: OneDrive check
# -----------------------------
Write-Section "2) OneDrive check"
if ($repoRoot -like "*OneDrive*") {
  Write-Warn "Path under OneDrive can cause Next.js build issues (symlinks/locks). Consider moving to C:\Dev\afriportal"
} else {
  Write-Info "OK: Not under OneDrive."
}

# -----------------------------
# Section 3: WSL check
# -----------------------------
Write-Section "3) WSL check"
try {
  $wslStatus = wsl.exe --status
  if ($wslStatus) {
    Write-Info "WSL detected. For best performance, you can run this repo inside WSL2:"
    Write-Host "wsl --cd $repoRoot" -ForegroundColor Green
  }
} catch {
  Write-Info "WSL not installed (that's fine)."
}

# -----------------------------
# Section 4: Install dependencies
# -----------------------------
Write-Section "4) Install dependencies"
$lockFile = Join-Path $repoRoot "package-lock.json"
if ($DryRun) {
  if (Test-Path $lockFile) { Write-Info "[dry-run] npm ci" } else { Write-Info "[dry-run] npm install (to create lockfile)" }
} else {
  if (Test-Path $lockFile) {
    Write-Info "Using npm ci"
    npm ci
  } else {
    Write-Warn "No package-lock.json found. Running npm install to generate it."
    npm install
  }
}

# -----------------------------
# Section 5: Env templates
# -----------------------------
Write-Section "5) Env templates"
$envExample = @"
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
STORAGE_BUCKET_QUOTES=quotes
STORAGE_BUCKET_AUDIT_PHOTOS=audit-photos

NEXT_PUBLIC_ANALYTICS_URL=
NEXT_PUBLIC_ANALYTICS_URL_2=
NEXT_PUBLIC_POWERBI_URL=
DEMO_AUTH=0
"@

$examplePath = Join-Path $repoRoot ".env.example"
$localPath = Join-Path $repoRoot ".env.local"

if (-not (Test-Path $examplePath)) {
  if (-not $DryRun) { $envExample | Set-Content -Encoding UTF8 $examplePath }
  else { Write-Info "[dry-run] write .env.example" }
}

if (-not (Test-Path $localPath)) {
  if (-not $DryRun) { Copy-Item $examplePath $localPath }
  else { Write-Info "[dry-run] copy .env.local from .env.example" }
}

# -----------------------------
# Section 6: Post bootstrap tweaks
# -----------------------------
Write-Section "6) Post bootstrap"
if (-not $DryRun) {
  try { npx next telemetry disable | Out-Null } catch {}
} else {
  Write-Info "[dry-run] next telemetry disable"
}

# -----------------------------
# Section 7: Stage and ZIP repo (pruned)
# -----------------------------
Write-Section "7) Stage and ZIP (pruned)"
$tmp = Join-Path $env:TEMP "afriportal_stage_$stamp"
$zipName = Join-Path $repoRoot ("afriportal_demo_{0}.zip" -f $stamp)

if (Test-Path $tmp) {
  if (-not $DryRun) { Remove-Item -Recurse -Force $tmp }
  else { Write-Info "[dry-run] rm -r $tmp" }
}
if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $tmp | Out-Null }
else { Write-Info "[dry-run] mkdir $tmp" }

# Copy current repo to $tmp, pruning excluded folders/files
Write-Info "Staging files. This may take a moment on large repos..."
Copy-WithPrune -src $repoRoot -tmpRoot $tmp

# Remove the top-level staging of "." that would replicate absolute path
# Ensure our zip contains the repo content, not the parent folder wrapper
Write-Info "Creating ZIP: $zipName"
if (-not $DryRun) {
  if (Test-Path $zipName) { Remove-Item -Force $zipName }
  Compress-Archive -Path (Join-Path $tmp "*") -DestinationPath $zipName
} else {
  Write-Info "[dry-run] Compress-Archive $tmp -> $zipName"
}

# Cleanup staging
if (-not $DryRun) {
  try { Remove-Item -Recurse -Force $tmp } catch {}
} else {
  Write-Info "[dry-run] rm -r $tmp"
}

# -----------------------------
# Section 8: Summary
# -----------------------------
Write-Section "8) Summary"
Write-Info "ZIP created: $zipName"
Write-Info "To enable demo auth (no Supabase), set DEMO_AUTH=1 in .env.local"
Write-Info "Done - demo mode files are in place, and the repo is zipped."
