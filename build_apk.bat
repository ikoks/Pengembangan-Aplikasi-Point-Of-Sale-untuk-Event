@echo off
title Build APK PosEventKasir Release
echo =====================================================================
echo                MEMULAI BUILD APK RELEASE POS EVENT
echo =====================================================================
echo.

cd /d "%~dp0PosEventKasir"

echo [1/3] Menyiapkan bundle React Native (index.android.bundle)...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal melakukan bundle React Native!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Meng-compile APK Release via Gradle (gradlew assembleRelease)...
cd android
call gradlew.bat assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal melakukan compile APK via Gradle!
    cd ..
    pause
    exit /b %ERRORLEVEL%
)

cd ..
echo.
echo [3/3] Menyalin APK ke PosEventKasir-latest.apk di folder utama...
copy /Y "android\app\build\outputs\apk\release\app-release.apk" "..\PosEventKasir-latest.apk" >nul

echo.
echo =====================================================================
echo [SUKSES] Build APK berhasil!
echo File siap di: PosEventKasir-latest.apk
echo =====================================================================
echo.
pause

