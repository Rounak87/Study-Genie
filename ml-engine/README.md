StudyGenie ML — Demo launcher

This folder contains a small demo UI (`demo/index.html`) and helper scripts to run the ML engine.

Usage

- Set the Gemini API key in your environment as `GEMINI_API_KEY` (preferred) or `VITE_GEMINI_API_KEY` (fallback).
- Run the launcher (Windows):
  - `run.bat` (Batch)
  - or `.
un.ps1` (PowerShell)

What the launcher does

- Starts the API server (uvicorn)
- Creates a temporary `demo/index_env.html` that injects the `GEMINI_API_KEY` into `window.__GEMINI_API_KEY` so the demo can access it in the browser without committing secrets to source.
- Opens the env-injected demo in your default browser.

Notes

- Do NOT commit real API keys to source. Use environment variables or secret managers.
- If no key is set, the demo will warn in the console and Gemini calls will be skipped or fail.
