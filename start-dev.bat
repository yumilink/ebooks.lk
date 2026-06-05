@echo off
title Ebooks.lk - Next.js Dev Server
cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERROR: Node.js/npm is not installed or not in PATH.
  echo Download Node.js LTS from https://nodejs.org/
  echo Then run this script again.
  echo.
  pause
  exit /b 1
)

call "%~dp0stop-dev.bat"

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 pause & exit /b 1
)

if not exist ".env" (
  echo Creating .env from .env.example...
  copy /Y ".env.example" ".env"
  echo.
  echo IMPORTANT: Edit .env and set NEXTAUTH_SECRET and STREAM_TOKEN_SECRET
  echo.
)

if not exist "prisma\dev.db" (
  echo Setting up database and demo accounts...
  call npm run db:setup
)

echo.
echo ============================================================
echo  Ebooks.lk - LOCAL mode (HTTP)
echo ============================================================
echo.
echo  After Ready, open EXACTLY:
echo    http://localhost:3000/login
echo.
echo  Use http://  NOT https://  on this PC
echo.
echo  If layout looks broken: Ctrl+Shift+R in browser
echo  Other devices: use start-dev-lan.bat instead
echo.
echo  Press Ctrl+C to stop the server.
echo.

start "" "http://localhost:3000/login"
call npm run dev
