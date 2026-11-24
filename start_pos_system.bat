@echo off
title POS Event - Backend Local Server
echo =====================================================================
echo                POS EVENT - BACKEND LOCAL SERVER
echo =====================================================================
echo.
echo IP Komputer Server : 192.168.18.5
echo Port               : 8000
echo URL Akses Kasir HP : http://192.168.18.5:8000
echo Endpoint Health    : http://192.168.18.5:8000/api/v1/health
echo.
echo Menjalankan Backend Laravel di 0.0.0.0:8000...
echo =====================================================================
echo.
cd /d "%~dp0pos-event-backend"

set "PHP_CMD=php"
if exist "%USERPROFILE%\.config\herd\bin\php83\php.exe" (
    set "PHP_CMD=%USERPROFILE%\.config\herd\bin\php83\php.exe"
)

"%PHP_CMD%" artisan serve --host=0.0.0.0 --port=8000
pause
