@echo off
title Suzuki Cello School
cd /d "%~dp0"
echo Starting Suzuki Cello School dev server...
start "Suzuki Dev Server" cmd /k "npm run dev"
timeout /t 3 > nul
start http://localhost:5173
