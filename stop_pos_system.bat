@echo off
title POS Event - Matikan Server
echo =====================================================================
echo                MEMATIKAN SERVER POS EVENT & CLOUDFLARE
echo =====================================================================
echo.
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /IM php.exe >nul 2>&1
powershell -Command "Get-Process | Where-Object { $_.CommandLine -like '*artisan serve*' } | Stop-Process -Force" >nul 2>&1
if exist "%~dp0CLOUDFLARE_URL.txt" del /F /Q "%~dp0CLOUDFLARE_URL.txt"
echo Semua proses backend dan Cloudflare Tunnel telah dihentikan.
echo.
timeout /t 3
