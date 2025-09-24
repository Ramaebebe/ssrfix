
# Clean caches and untrack .next in PowerShell
Write-Host "Cleaning build caches ..."
Remove-Item -Recurse -Force .next, "node_modules\.cache" -ErrorAction SilentlyContinue

Write-Host "Ensuring .next is ignored by git ..."
if (-not (Get-Content .gitignore | Select-String -SimpleMatch ".next")) {
  Add-Content .gitignore ".next"
}

Write-Host "Untracking .next from git index (if present) ..."
git rm -r --cached .next 2>$null

Write-Host "Done. Now reinstall and build:"
Write-Host "  npm install"
Write-Host "  npm run lint"
Write-Host "  npm run build"
