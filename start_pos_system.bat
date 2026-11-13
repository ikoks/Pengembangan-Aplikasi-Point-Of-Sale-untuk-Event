@echo off
title POS Event - Backend & Ngrok Tunnel
echo =====================================================================
echo                POS EVENT - BACKEND & NGROK TUNNEL
echo =====================================================================
echo.

REM 1. Nyalakan Backend Laravel di port 8000
echo [1/2] Menyalakan Backend Laravel di port 8000...
cd /d "%~dp0pos-event-backend"
start "POS Backend Server" /min cmd /c "php artisan serve --host=0.0.0.0 --port=8000"

timeout /t 3 /nobreak >nul
cd /d "%~dp0"

echo [2/2] Menjalankan Ngrok Tunnel di port 8000...
echo.
echo =====================================================================
echo Perhatikan baris 'Forwarding' di bawah ini:
echo Salin URL https://xxxx.ngrok-free.app (atau .ngrok-free.dev)
echo dan masukkan ke HP Kasir pada menu 'ATUR URL SERVER'!
echo =====================================================================
echo.

".\ngrok.exe" http 8000
pause
