# Clear Next.js cache script
Write-Host "Stopping any running Next.js processes..."
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Clearing .next directory..."
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}

Write-Host "Clearing node_modules/.cache..."
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
}

Write-Host "Cache cleared! You can now run: npm run dev"

