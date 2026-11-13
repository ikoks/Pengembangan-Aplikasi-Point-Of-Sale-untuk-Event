Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   POS EVENT SYSTEM - BACKEND & CLOUDFLARE TUNNEL    " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Start Laravel Backend
Write-Host "`n[1/2] Menyalakan Backend Laravel di port 8000..." -ForegroundColor Yellow
$backendProcess = Start-Process cmd -ArgumentList "/c php artisan serve --host=0.0.0.0 --port=8000" -WorkingDirectory "$PSScriptRoot\pos-event-backend" -WindowStyle Minimized -PassThru

Start-Sleep -Seconds 3

# 2. Start Cloudflare Tunnel
Write-Host "[2/2] Menghubungkan Cloudflare Tunnel..." -ForegroundColor Yellow
$cloudflaredPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $cloudflaredPath
$psi.Arguments = "tunnel --url http://127.0.0.1:8000"
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)

$url = ""
while (-not $proc.HasExited -and [string]::IsNullOrEmpty($url)) {
    $line = $proc.StandardError.ReadLine()
    if ($line -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
        $url = $matches[1]
        break
    }
}

if ($url) {
    Set-Content -Path "$PSScriptRoot\CLOUDFLARE_URL.txt" -Value $url -Encoding UTF8
    Clear-Host
    Write-Host ""
    Write-Host "==========================================================================" -ForegroundColor Green
    Write-Host "                  BERHASIL TERHUBUNG KE INTERNET!                        " -ForegroundColor Green
    Write-Host "==========================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "SALIN URL INI DAN MASUKKAN DI HP KASIR PADA 'ATUR URL SERVER':" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  >>>  $url  <<<" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "(URL ini juga sudah otomatis disimpan di file: CLOUDFLARE_URL.txt)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "--------------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "PENTING: JANGAN TUTUP JENDELA INI SELAMA KASIR DIGUNAKAN." -ForegroundColor Red
    Write-Host "Tekan Ctrl+C untuk mematikan server." -ForegroundColor DarkGray
    Write-Host "--------------------------------------------------------------------------" -ForegroundColor DarkGray
}

$proc.WaitForExit()

