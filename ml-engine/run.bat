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
start demo\index.html

echo Happy Learning!
pause
