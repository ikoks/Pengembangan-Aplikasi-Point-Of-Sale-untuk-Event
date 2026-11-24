@echo off
title Build APK PosEventKasir Release
echo =====================================================================
echo                MEMULAI BUILD APK RELEASE POS EVENT
echo =====================================================================
echo.

cd /d "%~dp0PosEventKasir\android"

echo [1/2] Meng-compile APK Release via Gradle (gradlew assembleRelease)...
call gradlew.bat assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal melakukan compile APK via Gradle!
    cd /d "%~dp0"
    exit /b %ERRORLEVEL%
)

cd /d "%~dp0"
echo.
echo [2/2] Menyalin APK ke PosEventKasir-latest.apk di folder utama...
copy /Y "PosEventKasir\android\app\build\outputs\apk\release\app-release.apk" "PosEventKasir-latest.apk" >nul

echo.
echo =====================================================================
echo [SUKSES] Build APK berhasil!
echo File siap di: PosEventKasir-latest.apk
echo =====================================================================
echo.
