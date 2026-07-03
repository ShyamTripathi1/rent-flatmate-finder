@echo off
echo Starting Rent ^& Flatmate Finder...
echo.

:: Start Backend
echo Starting Backend...
cd /d "%~dp0backend"
start "Backend" cmd /k "node node_modules\ts-node-dev\lib\bin.js --respawn --transpile-only src\index.ts"

:: Wait a moment then start Frontend
timeout /t 2 /nobreak >nul

echo Starting Frontend...
cd /d "%~dp0frontend"
start "Frontend" cmd /k "node node_modules\vite\bin\vite.js"

:: Go back to root
cd /d "%~dp0"

echo.
echo Both servers starting...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
pause
