@echo off
title POS Event - Server & Cloudflare Tunnel
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_pos_system.ps1"
pause
