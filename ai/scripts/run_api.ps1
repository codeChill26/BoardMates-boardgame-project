Param(
  [int]$Port = 8001
)

# Run FastAPI in dev mode using the project-local venv.
# Usage:
#   powershell -ExecutionPolicy Bypass -File ai/scripts/run_api.ps1

$ErrorActionPreference = 'Stop'

Set-Location (Resolve-Path "$PSScriptRoot\..\..")

$python = "ai\venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
  Write-Host "Missing venv at ai/venv. Run: powershell -ExecutionPolicy Bypass -File ai/scripts/setup.ps1" -ForegroundColor Yellow
  exit 1
}

& $python -m uvicorn ai.api.main:app --reload --host 0.0.0.0 --port $Port
