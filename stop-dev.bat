@echo off
title Stop Ebooks.lk dev servers
echo Stopping anything on ports 3000, 3001, 3002...

for %%P in (3000 3001 3002) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    echo Killing PID %%A on port %%P
    taskkill /F /PID %%A >nul 2>&1
  )
)

echo Done. You can now run start-dev.bat
