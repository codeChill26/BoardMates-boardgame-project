# Project-local Python AI environment bootstrap (Windows / PowerShell 5.1+)
#
# What it does:
# - Ensures a virtual environment exists at ai/venv
# - Installs Python dependencies from ai/requirements.txt
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File ai/scripts/setup.ps1

$ErrorActionPreference = 'Stop'

Set-Location (Resolve-Path "$PSScriptRoot\..\..")

Write-Host "== AI setup starting =="

# Prefer Python Launcher (py.exe) on Windows.
$py = (Get-Command py -ErrorAction SilentlyContinue)
if (-not $py) {
  Write-Host "Python Launcher (py) not found. Install Python 3.12+ from python.org." -ForegroundColor Red
  exit 1
}

$venvPath = "ai\venv"
if (-not (Test-Path $venvPath)) {
  Write-Host "Creating venv at $venvPath"
  py -m venv $venvPath
}

$python = "$venvPath\Scripts\python.exe"

Write-Host "Upgrading pip..."
& $python -m pip install --upgrade pip

Write-Host "Installing requirements..."
& $python -m pip install -r ai\requirements.txt

Write-Host "== AI setup done =="
Write-Host "Next: run the API => powershell -ExecutionPolicy Bypass -File ai/scripts/run_api.ps1" -ForegroundColor Green
