@echo off
REM ============================================================
REM  ProgressReport — unified start script for Windows
REM  Usage: double-click start.bat  OR  run from cmd/PowerShell
REM ============================================================

setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend
set FRONTEND_DIR=%ROOT_DIR%frontend

echo.
echo  ================================================
echo   ProgressReport — Starting up
echo  ================================================
echo.

REM ── Check Node ───────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node %NODE_VER% found

REM ── Copy .env ────────────────────────────────────
if not exist "%BACKEND_DIR%\.env" (
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
    echo [OK] Created backend\.env from .env.example
)

REM ── Install backend deps ─────────────────────────
echo.
echo [INFO] Installing backend dependencies...
echo        (First run downloads Puppeteer/Chromium ~170 MB)
cd /d "%BACKEND_DIR%"
call npm install
if %errorlevel% neq 0 ( echo [ERROR] Backend install failed & pause & exit /b 1 )
echo [OK] Backend dependencies ready

REM ── Install frontend deps ────────────────────────
echo.
echo [INFO] Installing frontend dependencies...
cd /d "%FRONTEND_DIR%"
call npm install
if %errorlevel% neq 0 ( echo [ERROR] Frontend install failed & pause & exit /b 1 )
echo [OK] Frontend dependencies ready

REM ── Launch servers in separate windows ───────────
echo.
echo  ================================================
echo   Backend  ^>  http://localhost:5000
echo   Frontend ^>  http://localhost:5173
echo   Close either window to stop that server.
echo  ================================================
echo.

REM Open backend in a new cmd window
start "ProgressReport — Backend (port 5000)" cmd /k "cd /d %BACKEND_DIR% && npm run dev"

REM Short pause so backend binds first
timeout /t 2 /nobreak >nul

REM Open frontend in a new cmd window
start "ProgressReport — Frontend (port 5173)" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo [OK] Both servers launched in separate windows.
echo      Open http://localhost:5173 in your browser.
echo.
pause
