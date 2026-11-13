@echo off
title POS Event - Server & Cloudflare Tunnel
echo =====================================================================
echo          POS EVENT SYSTEM - BACKEND & CLOUDFLARE TUNNEL
echo =====================================================================
echo.
echo [1/2] Menyalakan Backend Laravel di port 8000...
cd /d "%~dp0pos-event-backend"
start "POS Backend Server" /min php artisan serve --host=0.0.0.0 --port=8000

echo Menunggu server backend siap...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Menghubungkan Cloudflare Tunnel ke Internet...
echo.
echo =====================================================================
echo URL Publik HTTPS Anda akan muncul di bawah ini (cari yang berakhiran .trycloudflare.com).
echo Salin URL tersebut dan gunakan di HP Kasir!
echo =====================================================================
echo.

"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:8000
pause

