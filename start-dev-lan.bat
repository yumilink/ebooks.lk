@echo off
title Ebooks.lk - LAN HTTPS Dev Server
cd /d "%~dp0"

call "%~dp0stop-dev.bat"

if not exist "node_modules\" call npm install
if not exist ".env" copy /Y ".env.example" ".env"
if not exist "prisma\dev.db" call npm run db:setup

echo.
echo ============================================================
echo  Ebooks.lk - LAN mode (HTTPS) for phones / other PCs
echo ============================================================
echo.
echo  STEP 1: Stop any other dev server first (Ctrl+C in other window)
echo  STEP 2: Find your IP with:  ipconfig
echo          (IPv4 Address, e.g. 192.168.1.241)
echo  STEP 3: On THIS PC and OTHER devices open:
echo            https://YOUR-IP:3000/login
echo          Example: https://192.168.1.241:3000/login
echo.
echo  IMPORTANT:
echo  - Use https://  (NOT http://) when using dev:lan
echo  - Accept the browser security warning once
echo  - If login fails on other devices, edit .env:
echo      NEXTAUTH_URL=https://YOUR-IP:3000
echo    then restart this script.
echo.
echo  Do NOT use https:// while running start-dev.bat (HTTP only).
echo.
echo  Press Ctrl+C to stop.
echo.

call npm run dev:lan
