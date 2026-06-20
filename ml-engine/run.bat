@echo off
:: StudyGenie Startup Script (Batch)
:: This script automates training (if needed), starting the API, and opening the UI.

set ROOT=%~dp0
cd /d %ROOT%

echo ======================================
echo   StudyGenie ML Engine Launcher
echo ======================================
echo.

:: 1. Determine Python Executable
set PYTHON_EXE=python
if exist ".venv\Scripts\python.exe" (
    set PYTHON_EXE=.venv\Scripts\python.exe
    echo [^√] Using virtual environment Python.
)

:: 2. Check for Model
if not exist "model\dkt_model.pt" (
    echo [!] Model file not found.
    echo [^>] Starting training pipeline...
    %PYTHON_EXE% train_model.py
) else (
    echo [^√] Trained model found.
)

:: 3. Start API Server
echo [^>] Starting ML API Server (Port 8000)...
:: start /b runs in background without a new window
start /b %PYTHON_EXE% -m uvicorn api.main:app --host 127.0.0.1 --port 8000

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
    $root = '%~dp0'; 
    $src = Join-Path $root 'demo\index.html'; 
    $dst = Join-Path $root 'demo\index_env.html'; 
    try { 
        $content = Get-Content $src -Raw; 
        $keyValue = if ($envKey) { '\"' + $envKey + '\"' } else { 'null' };
        $prefix = '<script>window.__GEMINI_API_KEY = ' + $keyValue + ';</script>`n'; 
        Set-Content -Path $dst -Value ($prefix + $content); 
        Start-Process -FilePath $dst -ErrorAction Stop
    } catch { 
        Start-Process -FilePath $src 
    }
"

echo Happy Learning!
pause
