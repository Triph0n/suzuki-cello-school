@echo off
title Suzuki Cello School - Offline
cd /d "%~dp0"

if not exist node_modules (
  echo Installing app dependencies for the first offline start...
  call npm install
  if errorlevel 1 (
    echo.
    echo Installation failed. Check the message above.
    pause
    exit /b 1
  )
)

set VITE_DATA_BACKEND=local
set VITE_MEDIA_BACKEND=local
set VITE_API_BASE_URL=

echo Starting Suzuki Cello School in offline mode...
start "Suzuki Cello Offline" cmd /k "npm run dev:offline"
timeout /t 3 /nobreak >nul
start http://127.0.0.1:5173
