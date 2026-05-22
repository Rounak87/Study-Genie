@echo off
:: StudyGenie Startup Script (Batch)
:: This script automates training (if needed), starting the API, and opening the UI.

set ROOT=%~dp0
cd /d %ROOT%

echo ======================================
echo   StudyGenie ML Engine Launcher
echo ======================================
echo.

:: 1. Check for Model
if not exist "model\dkt_model.pt" (
    echo [!] Model file not found.
    echo [^>] Starting training pipeline...
    python train_model.py
) else (
    echo [^√] Trained model found.
)

:: 2. Start API Server
echo [^>] Starting ML API Server (Port 8000)...
:: start /b runs in background without a new window
start /b python -m uvicorn api.main:app --host 127.0.0.1 --port 8000

:: 3. Wait for Initialization
echo [^>] Waiting for server to spin up (3s)...
timeout /t 3 /nobreak > nul

:: 4. Launch UI
echo [^√] Server should be ready.
echo [^>] Opening Demo Frontend...
echo.
:: Create an env-injected copy of the demo HTML so the browser can read the API key from window.__GEMINI_API_KEY
powershell -NoProfile -Command "
    $envKey = $env:GEMINI_API_KEY; if (-not $envKey) { $envKey = $env:VITE_GEMINI_API_KEY }; 
    $root = Split-Path -Parent '%~dp0'; 
    $src = Join-Path $root 'demo\index.html'; 
    $dst = Join-Path $root 'demo\index_env.html'; 
    try { $content = Get-Content $src -Raw; $prefix = '<script>window.__GEMINI_API_KEY = ' + (if ($envKey) { '"' + $envKey + '"' } else { 'null' }) + ';</script>`n'; Set-Content -Path $dst -Value ($prefix + $content); Start-Process $dst } catch { Start-Process $src }
"

echo Happy Learning!
pause
