@echo off
title POS Event - Matikan Server
echo =====================================================================
echo                MEMATIKAN SERVER POS EVENT & CLOUDFLARE
echo =====================================================================
echo.
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq POS Backend Server*" >nul 2>&1
echo Semua proses backend dan Cloudflare Tunnel telah dihentikan.
echo.
timeout /t 3

