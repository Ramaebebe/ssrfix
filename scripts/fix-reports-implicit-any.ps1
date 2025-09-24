Param(
  [string]$FilePath = "src/app/client/reports/page.tsx"
)

if (!(Test-Path $FilePath)) {
  Write-Error "File not found: $FilePath"
  exit 1
}

# Backup
$backup = "$FilePath.bak"
Copy-Item $FilePath $backup -Force
Write-Host "Backup created at $backup"

# Read file
$content = Get-Content -Raw $FilePath

# Replace the filter callback param with an explicitly typed one.
$patterns = @(
  '\.filter\(\s*\(n\)\s*=>\s*!Number\.isNaN\(n\)\s*\)',
  '\.filter\(\s*\(n\s*:\s*any\)\s*=>\s*!Number\.isNaN\(n\)\s*\)',
  '\.filter\(\s*\(n\s*:\s*unknown\)\s*=>\s*!Number\.isNaN\(n\)\s*\)'
)
$replacement = '.filter((x: number) => !Number.isNaN(x))'

$replaced = $false
foreach ($p in $patterns) {
  $newContent = [System.Text.RegularExpressions.Regex]::Replace($content, $p, $replacement)
  if ($newContent -ne $content) {
    $content = $newContent
    $replaced = $true
  }
}

if (-not $replaced) {
  Write-Host "No exact filter pattern matched. Attempting a broader fix on the 'spark' line..." -ForegroundColor Yellow
  $content = $content -replace 'map\(\s*\(n\s*:\s*string\)\s*=>\s*Number\(n\.trim\(\)\)\s*\)\s*\.filter\(\s*\(.*?\)\s*=>\s*!Number\.isNaN\(.*?\)\s*\)',
                               'map((n: string) => Number(n.trim())).filter((x: number) => !Number.isNaN(x))'
}

Set-Content -Path $FilePath -Value $content -NoNewline
Write-Host "Patched $FilePath successfully." -ForegroundColor Green
