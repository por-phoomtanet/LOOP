# Local dev equivalent of deploy.sh - Windows only.
#
# Unlike deploy.sh (prod, Linux): local dev runs apps/api and apps/web directly via
# `bun run dev`/`next dev` in their own terminals (not through Docker) - docker-compose
# is only used here to run `db` (Postgres). This script does not build/restart api/web
# containers, and deliberately does not kill your running dev-server terminals either
# (that could interrupt work in progress).
#
# Use this after pulling code that includes a new migration (from another session, or
# after switching branches) to bring your local Postgres up to date in one command.
#
# Automatically picks up any new migration (same as deploy.sh) - never needs editing.
#
# Usage: powershell -ExecutionPolicy Bypass -File deploy.local.ps1
#    or, if execution policy already allows it: .\deploy.local.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> [1/3] npm install (in case package.json changed)" -ForegroundColor Cyan
npm install

Write-Host "==> [2/3] making sure Postgres (db) is running" -ForegroundColor Cyan
docker compose up -d db

Write-Host "==> [3/3] applying any pending database migrations" -ForegroundColor Cyan
npm run migrate:deploy

Write-Host ""
Write-Host "Done - local Postgres (loop) is now in sync with the latest schema." -ForegroundColor Green
Write-Host "If the apps/api dev server (bun run dev) is already running, restart it manually" -ForegroundColor Yellow
Write-Host "(env/schema changes are not picked up automatically by a running process)." -ForegroundColor Yellow
