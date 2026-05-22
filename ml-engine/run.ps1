# StudyGenie Startup Script (PowerShell)
# This script automates training (if needed), starting the API, and opening the UI.

$root = Get-Location
$modelPath = Join-Path $root "model\dkt_model.pt"

Write-Host "`n======================================" -ForegroundColor Blue
Write-Host "  StudyGenie ML Engine Launcher" -ForegroundColor Blue
Write-Host "======================================`n" -ForegroundColor Blue

# 1. Check for Model
if (!(Test-Path $modelPath)) {
    Write-Host "[!] Model file not found at $modelPath" -ForegroundColor Yellow
    Write-Host "[>] Starting training pipeline..." -ForegroundColor Yellow
    python train_model.py
} else {
    Write-Host "[√] Trained model found." -ForegroundColor Green
}

# 2. Start API Server
Write-Host "[>] Starting ML API Server (Port 8000)..." -ForegroundColor Cyan
# Start in a new process to keep the terminal clean
# We use -WindowStyle Hidden to keep the backend in the background
Start-Process python -ArgumentList "-m uvicorn api.main:app --host 127.0.0.1 --port 8000" -WindowStyle Hidden

# 3. Wait for Initialization
Write-Host "[>] Waiting for server to spin up..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 4. Launch UI (create env-injected copy if GEMINI key is present)
Write-Host "[√] Server should be ready." -ForegroundColor Green
Write-Host "[>] Opening Demo Frontend...`n" -ForegroundColor Green

# Build an env-injected copy of the demo HTML so the browser can access the API key
$envKey = $env:GEMINI_API_KEY
if (-not $envKey) { $envKey = $env:VITE_GEMINI_API_KEY }
$src = Join-Path $root "demo\index.html"
$dst = Join-Path $root "demo\index_env.html"
try {
    $content = Get-Content $src -Raw
    $prefix = "<script>window.__GEMINI_API_KEY = " + (if ($envKey) { '"' + $envKey + '"' } else { 'null' }) + ";</script>`n"
    Set-Content -Path $dst -Value ($prefix + $content)
    Start-Process $dst
} catch {
    Write-Host "[!] Failed to create env-injected demo copy. Opening original demo instead." -ForegroundColor Yellow
    Start-Process $src
}

Write-Host "Happy Learning!" -ForegroundColor Magenta
