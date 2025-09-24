
# Verify no 'open' var exists and locate Topbar files
Write-Host "Searching for 'const [open' across src ..."
Select-String -Path src\**\*.{ts,tsx} -Pattern "const \[open" -List -ErrorAction SilentlyContinue

Write-Host "`nLooking for Topbar.tsx files ..."
Get-ChildItem -Recurse -Filter Topbar.tsx src | ForEach-Object { $_.FullName }

Write-Host "`nTopbar.tsx preview:"
Get-Content -First 30 src\components\Topbar.tsx
