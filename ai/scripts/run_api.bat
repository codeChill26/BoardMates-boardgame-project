@echo off
REM Run FastAPI in dev mode using the project-local venv.
REM Usage:
REM   ai\scripts\run_api.bat

cd /d %~dp0\..\..

if not exist ai\venv\Scripts\python.exe (
  echo Missing venv at ai\venv. Run: powershell -ExecutionPolicy Bypass -File ai\scripts\setup.ps1
  exit /b 1
)

ai\venv\Scripts\python.exe -m uvicorn ai.api.main:app --reload --host 0.0.0.0 --port 8001
