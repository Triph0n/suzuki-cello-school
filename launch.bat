@echo off
cd /d "%~dp0"
start "Suzuki Cello Server" npm run dev
timeout /t 3 /nobreak >nul
start http://localhost:5173
